import logging
from django.conf import settings
from .models import Scenario, Activity, Screen, Media, ValidationReport
from .validation_engine import get_referenced_media_ids_and_urls

logger = logging.getLogger(__name__)

def resolve_absolute_url(url_path, request=None):
    if not url_path:
        return ""
    if url_path.startswith("http://") or url_path.startswith("https://"):
        return url_path
    if request:
        return request.build_absolute_uri(url_path)
    # Fallback to default domain or relative path
    return f"{settings.MEDIA_URL.rstrip('/')}/{url_path.lstrip('/')}"

def build_runtime_payload(scenario, request=None):
    """
    Assembles a complete Scenario hierarchy (Scenario -> Activities -> Screens -> resolved Media)
    into a single structured runtime JSON payload for desktop/Electron app rendering.
    """
    debug_missing = []
    debug_warnings = []
    
    # 1. Resolve Validation Status
    try:
        latest_report = ValidationReport.objects.filter(scenario=scenario).latest("validated_at")
        validation_status = latest_report.status
        # Collect warnings from last report if any
        if latest_report.results:
            debug_warnings = [r["message"] for r in latest_report.results if r.get("severity") == "WARNING"]
    except ValidationReport.DoesNotExist:
        validation_status = "NOT_RUN"

    # 2. Assemble Scenario Metadata
    scenario_data = {
        "id": scenario.id,
        "title": scenario.title,
        "description": scenario.description or "",
        "grade": {
            "id": scenario.grade.id,
            "name": scenario.grade.grade_name
        } if scenario.grade else None,
        "subject": scenario.subject,
        "language": scenario.language,
        "difficulty": scenario.difficulty,
        "estimated_duration": scenario.estimated_duration,
        "learning_outcomes": [lo.text for lo in scenario.learning_outcomes.all()],
        "tags": scenario.tags or [],
        "thumbnail_url": resolve_absolute_url(scenario.thumbnail, request) if scenario.thumbnail else ""
    }

    # 3. Assemble Activities (ordered by display_order, excluding is_deleted=True)
    activities_list = []
    activities = scenario.activities.all().order_by("display_order")
    
    for act in activities:
        # Assemble Screens (ordered by display_order)
        screens_list = []
        screens = act.screens.all().order_by("display_order")
        
        for scr in screens:
            resolved_media = []
            content = scr.content or {}
            
            referenced_ids, referenced_urls = get_referenced_media_ids_and_urls(content)
            
            # Resolve IDs
            for ref_id in referenced_ids:
                try:
                    media_asset = Media.objects.get(id=ref_id)
                    media_url = resolve_absolute_url(media_asset.file.url if media_asset.file else media_asset.url, request)
                    resolved_media.append({
                        "media_id": ref_id,
                        "type": media_asset.media_type,
                        "url": media_url,
                        "missing": False
                    })
                except Media.DoesNotExist:
                    debug_missing.append({
                        "type": "media_id",
                        "reference": str(ref_id),
                        "screen_id": scr.id,
                        "screen_title": scr.title or "(Untitled)"
                    })
                    resolved_media.append({
                        "media_id": ref_id,
                        "type": "IMAGE",  # Default type on broken reference
                        "url": "",
                        "missing": True
                    })

            # Resolve URLs
            for ref_url in referenced_urls:
                if "/media/" in ref_url:
                    filename = ref_url.split("/")[-1]
                    # Find by exact URL or end of file path name
                    media_asset = Media.objects.filter(url=ref_url).first() or Media.objects.filter(file__endswith=filename).first()
                    if media_asset:
                        media_url = resolve_absolute_url(media_asset.file.url if media_asset.file else media_asset.url, request)
                        resolved_media.append({
                            "media_id": media_asset.id,
                            "type": media_asset.media_type,
                            "url": media_url,
                            "missing": False
                        })
                    else:
                        debug_missing.append({
                            "type": "media_url",
                            "reference": ref_url,
                            "screen_id": scr.id,
                            "screen_title": scr.title or "(Untitled)"
                        })
                        resolved_media.append({
                            "media_id": None,
                            "type": "IMAGE",
                            "url": ref_url,
                            "missing": True
                        })
            
            screens_list.append({
                "id": scr.id,
                "title": scr.title or "",
                "screen_type": scr.screen_type,
                "display_order": scr.display_order,
                "content": content,
                "resolved_media": resolved_media
            })

        activities_list.append({
            "id": act.id,
            "title": act.title,
            "description": act.description or "",
            "learning_objective": act.learning_objective or "",
            "skills": [s.name for s in act.skills.all()],
            "estimated_duration": act.estimated_duration,
            "mastery_threshold": act.mastery_threshold,
            "display_order": act.display_order,
            "screens": screens_list
        })

    payload = {
        "scenario": scenario_data,
        "activities": activities_list,
        "debug": {
            "missing_assets": debug_missing,
            "warnings": debug_warnings,
            "runtime_version": "1.0.0",
            "validation_status": validation_status
        }
    }
    
    return payload


# ---------------------------------------------------------------------------
# Phase 7: .elab Packaging Pipeline
# ---------------------------------------------------------------------------
import hashlib
import json as _json
import os
import re
import shutil
import tempfile
import zipfile
from datetime import datetime, timezone

from django.conf import settings as django_settings
from django.db import transaction


def _sha256_file(path):
    """Compute SHA-256 of a file on disk."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _sha256_bytes(data: bytes):
    return hashlib.sha256(data).hexdigest()


def _slugify(text):
    """Simple slug: lowercase, replace spaces/special chars with hyphens."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text[:80]


def _next_version(package):
    """
    Auto-increment minor version.  1.0 -> 1.1 -> 1.2 ...
    Returns the new version string.
    """
    from .models import PublishVersion
    existing = PublishVersion.objects.filter(
        published_package=package
    ).order_by("-published_at").first()
    if not existing:
        return "1.0"
    try:
        major, minor = existing.version_number.split(".")
        return f"{major}.{int(minor) + 1}"
    except (ValueError, AttributeError):
        return "1.0"


def _media_type_subfolder(media_type):
    """Map MediaType → subdirectory name inside the package's media/ folder."""
    return {
        "IMAGE": "images",
        "AUDIO": "audio",
        "VIDEO": "video",
        "DOCUMENT": "documents",
    }.get(media_type, "other")


def _rewrite_payload_media_urls(payload, media_file_map):
    """
    Walk the payload and replace absolute/relative media URLs with relative
    package paths (e.g. media/images/photo.jpg).
    media_file_map: { old_url: relative_package_path }
    Returns a new payload dict (deep copy with URLs rewritten).
    """
    payload_str = _json.dumps(payload)
    for old_url, rel_path in media_file_map.items():
        if old_url:
            payload_str = payload_str.replace(old_url, rel_path)
    return _json.loads(payload_str)


def build_elab_package(scenario, version=None, release_notes=None, published_by=None, force_regenerate=False):
    """
    Full 7-step .elab packaging pipeline.

    Returns:
        dict with keys: version_obj (PublishVersion), elab_path (str)

    Raises:
        ValueError  – validation FAILED (errors present); includes report dict
        ValueError  – duplicate version requested
        RuntimeError – packaging error after validation passed
    """
    from .models import PublishedPackage, PublishVersion
    from .validation_engine import run_validation_engine

    # -----------------------------------------------------------------------
    # STEP 1: GATE — run validation fresh
    # -----------------------------------------------------------------------
    report_data = run_validation_engine(scenario)
    if report_data["status"] == "FAILED":
        raise ValueError(("VALIDATION_FAILED", report_data))

    # -----------------------------------------------------------------------
    # STEP 2: ASSEMBLE — call build_runtime_payload (no request → relative URLs)
    # -----------------------------------------------------------------------
    payload = build_runtime_payload(scenario, request=None)

    # -----------------------------------------------------------------------
    # STEP 3: MEDIA — resolve physical files; build the rewrite map
    # -----------------------------------------------------------------------
    # Get or create the PublishedPackage record first (needed for version check)
    package, _ = PublishedPackage.objects.get_or_create(
        scenario=scenario,
        defaults={
            "package_name": scenario.title,
            "compression_status": "PENDING",
        }
    )

    # Version check / resolve
    existing_version_obj = None
    if force_regenerate:
        if not version:
            raise ValueError("Version must be specified for regeneration.")
        try:
            existing_version_obj = PublishVersion.objects.get(
                published_package=package, version_number=version
            )
        except PublishVersion.DoesNotExist:
            raise ValueError(f"Version '{version}' does not exist to regenerate.")
        new_version = version
        build_number = existing_version_obj.build_number + 1
    else:
        if version:
            if PublishVersion.objects.filter(
                published_package=package, version_number=version
            ).exists():
                raise ValueError(("DUPLICATE_VERSION", version))
            new_version = version
        else:
            new_version = _next_version(package)
        # Build number = count of existing versions + 1
        build_number = PublishVersion.objects.filter(
            published_package=package
        ).count() + 1

    # Prepare package root dir
    packages_root = getattr(django_settings, "PACKAGES_ROOT", None) or os.path.join(
        django_settings.MEDIA_ROOT, "packages"
    )
    os.makedirs(packages_root, exist_ok=True)

    # Work in a temp directory for atomicity
    tmp_dir = tempfile.mkdtemp(prefix="elab_build_")
    tmp_elab_path = None

    try:
        pkg_dir = os.path.join(tmp_dir, "package")
        media_pkg_dir = os.path.join(pkg_dir, "media")
        os.makedirs(pkg_dir, exist_ok=True)

        # Collect all resolved_media entries across all screens
        media_file_map = {}  # old_url → relative_package_path
        file_list = []       # manifest entries

        for act in payload["activities"]:
            for scr in act["screens"]:
                for rm in scr.get("resolved_media", []):
                    if rm.get("missing") or not rm.get("url"):
                        continue
                    old_url = rm["url"]
                    media_type = rm.get("type", "IMAGE")
                    subfolder = _media_type_subfolder(media_type)

                    # Find the Media DB object to get the physical file
                    media_id = rm.get("media_id")
                    try:
                        media_obj = Media.objects.get(id=media_id)
                    except (Media.DoesNotExist, TypeError):
                        media_obj = None

                    if media_obj and media_obj.file and media_obj.file.name:
                        src_path = media_obj.file.path  # absolute disk path
                        filename = os.path.basename(src_path)
                        dest_subfolder = os.path.join(media_pkg_dir, subfolder)
                        os.makedirs(dest_subfolder, exist_ok=True)
                        dest_path = os.path.join(dest_subfolder, filename)
                        if not os.path.exists(dest_path):
                            shutil.copy2(src_path, dest_path)
                        rel_path = f"media/{subfolder}/{filename}"
                        file_checksum = _sha256_file(dest_path)
                        file_list.append({
                            "path": rel_path,
                            "size": os.path.getsize(dest_path),
                            "checksum": file_checksum,
                        })
                    else:
                        # External URL — record as reference only, no file copy
                        rel_path = old_url  # keep as-is for external URLs
                    
                    media_file_map[old_url] = rel_path

        # Rewrite payload URLs to relative paths
        rewritten_payload = _rewrite_payload_media_urls(payload, media_file_map)

        # -----------------------------------------------------------------------
        # STEP 3 continued: write scenario.json
        # -----------------------------------------------------------------------
        scenario_json_bytes = _json.dumps(rewritten_payload, indent=2, ensure_ascii=False).encode("utf-8")
        scenario_json_path = os.path.join(pkg_dir, "scenario.json")
        with open(scenario_json_path, "wb") as f:
            f.write(scenario_json_bytes)
        scenario_json_checksum = _sha256_bytes(scenario_json_bytes)
        file_list.insert(0, {
            "path": "scenario.json",
            "size": len(scenario_json_bytes),
            "checksum": scenario_json_checksum,
        })

        # -----------------------------------------------------------------------
        # STEP 4: MANIFEST
        # -----------------------------------------------------------------------
        manifest = {
            "package_name": _slugify(scenario.title),
            "scenario_id": scenario.id,
            "scenario_title": scenario.title,
            "version": new_version,
            "build_number": build_number,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "published_by": str(published_by) if published_by else None,
            "runtime_version": "1.0.0",
            "files": file_list,
            "checksums": {
                "scenario_json": scenario_json_checksum,
            }
        }
        manifest_bytes = _json.dumps(manifest, indent=2, ensure_ascii=False).encode("utf-8")
        manifest_path = os.path.join(pkg_dir, "manifest.json")
        with open(manifest_path, "wb") as f:
            f.write(manifest_bytes)

        # -----------------------------------------------------------------------
        # STEP 5: COMPRESS → .elab (zip with custom extension)
        # -----------------------------------------------------------------------
        scenario_slug = _slugify(scenario.title)
        elab_filename = f"{scenario_slug}_v{new_version}.elab"
        tmp_elab_path = os.path.join(tmp_dir, elab_filename)

        with zipfile.ZipFile(tmp_elab_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, dirs, files in os.walk(pkg_dir):
                for fname in files:
                    abs_path = os.path.join(root, fname)
                    arcname = os.path.relpath(abs_path, pkg_dir)
                    zf.write(abs_path, arcname)

        elab_checksum = _sha256_file(tmp_elab_path)
        elab_size = os.path.getsize(tmp_elab_path)

        # -----------------------------------------------------------------------
        # STEP 5b: Move to final location
        # -----------------------------------------------------------------------
        final_elab_path = os.path.join(packages_root, elab_filename)
        if os.path.exists(final_elab_path):
            try:
                os.remove(final_elab_path)
            except OSError:
                pass
        shutil.move(tmp_elab_path, final_elab_path)
        tmp_elab_path = None  # moved, don't delete

        # -----------------------------------------------------------------------
        # STEP 6: RECORD — wrap in transaction.atomic
        # -----------------------------------------------------------------------
        with transaction.atomic():
            # Update PublishedPackage
            package.package_name = scenario.title
            package.compression_status = "COMPLETED"
            package.save()

            # Build download URL (relative for now)
            download_url = f"/api/v1/content/packages/"

            if existing_version_obj:
                # Clean up old file from disk
                if existing_version_obj.file_path and existing_version_obj.file_path != final_elab_path:
                    if os.path.exists(existing_version_obj.file_path):
                        try:
                            os.remove(existing_version_obj.file_path)
                        except OSError:
                            pass

                # Update existing row in place to keep integrity and raise build number
                existing_version_obj.build_number = build_number
                existing_version_obj.package_size = elab_size
                existing_version_obj.file_path = final_elab_path
                existing_version_obj.checksum = elab_checksum
                existing_version_obj.published_by = published_by
                if release_notes:
                    existing_version_obj.release_notes = release_notes
                existing_version_obj.save()
                version_obj = existing_version_obj
            else:
                version_obj = PublishVersion.objects.create(
                    published_package=package,
                    version_number=new_version,
                    build_number=build_number,
                    release_notes=release_notes or "",
                    package_size=elab_size,
                    download_url=download_url,
                    published_by=published_by,
                    file_path=final_elab_path,
                    checksum=elab_checksum,
                )

            # Update the download_url with the real package id
            version_obj.download_url = f"/api/v1/content/packages/{version_obj.id}/download/"
            version_obj.save(update_fields=["download_url"])

            # Mark scenario as PUBLISHED
            scenario.status = "PUBLISHED"
            scenario.save(update_fields=["status"])

        return {
            "version_obj": version_obj,
            "elab_path": final_elab_path,
            "elab_filename": elab_filename,
            "checksum": elab_checksum,
            "size": elab_size,
            "version": new_version,
            "build_number": build_number,
        }

    except ValueError:
        # Re-raise validation/duplicate errors cleanly
        raise
    except Exception as exc:
        logger.exception("Error during .elab packaging for scenario %s", scenario.id)
        raise RuntimeError(f"Packaging failed: {exc}") from exc
    finally:
        # Cleanup temp directory — always runs
        if tmp_elab_path and os.path.exists(tmp_elab_path):
            try:
                os.remove(tmp_elab_path)
            except OSError:
                pass
        if os.path.exists(tmp_dir):
            try:
                shutil.rmtree(tmp_dir, ignore_errors=True)
            except OSError:
                pass

