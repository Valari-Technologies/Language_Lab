import logging
import os
from django.db import transaction

from content_studio.models import PublishedPackage, PublishVersion
from content_studio.validation_engine import run_validation_engine
from content_studio.services.runtime_contact import build_runtime_experience

from .experience_builder import ExperienceBuilder
from .asset_collector import AssetCollector
from .metadata_builder import MetadataBuilder
from .manifest_builder import ManifestBuilder
from .zip_builder import ZipBuilder

logger = logging.getLogger(__name__)


def _next_version(package):
    """
    Auto-increment minor version. 1.0 -> 1.1 -> 1.2 ...
    Returns the new version string.
    """
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


class PublishService:
    """
    Orchestration service layer for the full .elab packaging and publication workflow.
    Sequences ExperienceBuilder, AssetCollector, MetadataBuilder, ManifestBuilder, and ZipBuilder internally.
    Acts as a single entry block called directly by existing views and endpoints.
    """

    def __init__(self, experience_builder=None, asset_collector=None, metadata_builder=None, manifest_builder=None, zip_builder=None):
        self.experience_builder = experience_builder or ExperienceBuilder()
        self.asset_collector = asset_collector or AssetCollector()
        self.metadata_builder = metadata_builder or MetadataBuilder()
        self.manifest_builder = manifest_builder or ManifestBuilder()
        self.zip_builder = zip_builder or ZipBuilder()

    def publish(self, experience, version=None, release_notes=None, published_by=None, force_regenerate=False):
        """
        Full .elab packaging and publishing pipeline conforming to EnglishLab Runtime specifications.

        Returns:
            dict with keys: version_obj (PublishVersion), elab_path (str), elab_filename, checksum, size, version, build_number

        Raises:
            ValueError – validation FAILED (errors present); includes report dict
            ValueError – duplicate version requested
            RuntimeError – packaging error after validation passed
        """
        # STEP 1: GATE — run validation fresh
        report_data = run_validation_engine(experience)
        if report_data["status"] == "FAILED":
            raise ValueError(("VALIDATION_FAILED", report_data))

        # STEP 2: ASSEMBLE — call ExperienceBuilder to build the preview_payload
        preview_payload = self.experience_builder.build_payload(experience)

        # STEP 2b: RUNTIME CONTRACT — convert preview_payload into the
        # EnglishLab Runtime v1.0 contract (experience.json written to .elab).
        runtime_contract = build_runtime_experience(experience, preview_payload)

        # STEP 3: RECORD RESOLUTION — resolve PublishedPackage and PublishVersion check
        package, _ = PublishedPackage.objects.get_or_create(
            experience=experience,
            defaults={
                "package_name": experience.title,
                "compression_status": "PENDING",
            }
        )

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
            build_number = PublishVersion.objects.filter(
                published_package=package
            ).count() + 1

        packages_root = self.zip_builder.get_packages_root()
        tmp_dir, pkg_dir = self.zip_builder.create_temp_workspace()
        tmp_elab_path = None

        try:
            # STEP 4: ASSETS & PAYLOAD REWRITE — collect physical media assets into assets/,
            # write the Runtime v1.0 contract as experience.json
            rewritten_payload, file_list, experience_json_checksum = self.asset_collector.collect_assets(
                preview_payload, pkg_dir, runtime_contract=runtime_contract
            )

            # STEP 5: METADATA — write metadata.json at package root
            metadata_dict, metadata_json_checksum, metadata_json_size = self.metadata_builder.build_metadata(
                experience=experience,
                version_number=new_version,
                pkg_dir=pkg_dir
            )
            file_list.insert(1, {
                "path": "metadata.json",
                "size": metadata_json_size,
                "checksum": metadata_json_checksum,
            })

            # STEP 6: MANIFEST — write manifest.json
            self.manifest_builder.build_manifest(
                experience=experience,
                version_number=new_version,
                build_number=build_number,
                published_by=published_by,
                file_list=file_list,
                experience_json_checksum=experience_json_checksum,
                metadata_json_checksum=metadata_json_checksum,
                pkg_dir=pkg_dir
            )

            # STEP 7: COMPRESS & FINALIZE — zip into .elab and move to target location
            tmp_elab_path, elab_filename, elab_checksum, elab_size = self.zip_builder.compress_package(
                pkg_dir=pkg_dir,
                tmp_dir=tmp_dir,
                experience_title=experience.title,
                version_number=new_version
            )

            final_elab_path = self.zip_builder.finalize_package(
                tmp_elab_path=tmp_elab_path,
                elab_filename=elab_filename,
                packages_root=packages_root
            )
            tmp_elab_path = None  # Moved successfully, don't delete

            # STEP 8: RECORD & DB TRANSACTION — update DB models inside transaction.atomic()
            with transaction.atomic():
                package.package_name = experience.title
                package.compression_status = "COMPLETED"
                package.save()

                download_url = f"/api/v1/content/packages/"

                if existing_version_obj:
                    if existing_version_obj.file_path and existing_version_obj.file_path != final_elab_path:
                        if os.path.exists(existing_version_obj.file_path):
                            try:
                                os.remove(existing_version_obj.file_path)
                            except OSError:
                                pass

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

                version_obj.download_url = f"/api/v1/content/packages/{version_obj.id}/download/"
                version_obj.save(update_fields=["download_url"])

                experience.status = "PUBLISHED"
                experience.save(update_fields=["status"])

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
            raise
        except Exception as exc:
            logger.exception("Error during .elab packaging for experience %s", experience.id)
            raise RuntimeError(f"Packaging failed: {exc}") from exc
        finally:
            self.zip_builder.cleanup(tmp_dir, tmp_elab_path)


def build_elab_package(experience, version=None, release_notes=None, published_by=None, force_regenerate=False):
    """
    Backward-compatible wrapper function invoking PublishService.
    """
    service = PublishService()
    return service.publish(
        experience=experience,
        version=version,
        release_notes=release_notes,
        published_by=published_by,
        force_regenerate=force_regenerate,
    )
