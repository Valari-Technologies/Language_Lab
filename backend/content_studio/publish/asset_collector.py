import hashlib
import json as _json
import logging
import os
import shutil
from content_studio.models import Media

logger = logging.getLogger(__name__)


def _sha256_file(path):
    """Compute SHA-256 of a file on disk."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _sha256_bytes(data: bytes):
    return hashlib.sha256(data).hexdigest()


def _media_type_subfolder(media_type):
    """Map MediaType → subdirectory name inside the package's assets/ folder."""
    return {
        "IMAGE": "images",
        "AUDIO": "audio",
        "VIDEO": "video",
        "DOCUMENT": "documents",
    }.get(media_type, "other")


def _rewrite_payload_media_urls(payload, media_file_map):
    """
    Walk the payload and replace absolute/relative media URLs with relative
    package paths (e.g. assets/images/photo.jpg).
    """
    payload_str = _json.dumps(payload)
    for old_url, rel_path in media_file_map.items():
        if old_url:
            payload_str = payload_str.replace(old_url, rel_path)
    return _json.loads(payload_str)


class AssetCollector:
    """
    Component builder for asset collection and relative path resolution under assets/.
    Manages file copy procedures into assets/ subfolders, absolute URL relative conversions,
    writing experience.json, and computing checksums for collected assets.
    """

    def collect_assets(self, payload, pkg_dir, runtime_contract=None):
        """
        Collects physical media assets into pkg_dir/assets/, rewrites URLs,
        and writes experience.json into pkg_dir.

        Args:
            payload:          Old preview_payload dict (used for asset discovery via
                              resolved_media / media_id fields).
            pkg_dir:          Absolute path to the package staging directory.
            runtime_contract: Optional. If provided this dict (from runtime_contact.py)
                              is written as experience.json after URL rewriting.
                              If None, the raw rewritten payload is written instead.

        Returns:
            (rewritten_payload, file_list, experience_json_checksum)
        """
        assets_pkg_dir = os.path.join(pkg_dir, "assets")
        media_file_map = {}  # old_url → relative_package_path
        file_list = []       # manifest file entries

        # ── Asset Discovery ────────────────────────────────────────────
        # Inspect the old preview_payload for resolved_media (snake_case).
        # The new runtime_contract uses resolvedMedia (camelCase) — we check
        # both keys so this works whether called with the old payload alone or
        # alongside a runtime_contract.
        for act in payload.get("activities", []):
            for scr in act.get("screens", []):
                # Support both old snake_case and new camelCase key names
                resolved_list = scr.get("resolved_media") or scr.get("resolvedMedia") or []
                for rm in resolved_list:
                    if rm.get("missing") or not rm.get("url"):
                        continue
                    old_url = rm["url"]
                    if old_url in media_file_map:
                        continue  # already processed this URL
                    media_type = rm.get("type", "IMAGE")
                    subfolder = _media_type_subfolder(media_type)

                    # Find the Media DB object to get the physical file path
                    media_id = rm.get("media_id")
                    try:
                        media_obj = Media.objects.get(id=media_id)
                    except (Media.DoesNotExist, TypeError):
                        media_obj = None

                    if media_obj and media_obj.file and media_obj.file.name and os.path.exists(media_obj.file.path):
                        src_path = media_obj.file.path
                        filename = os.path.basename(src_path)
                        dest_subfolder = os.path.join(assets_pkg_dir, subfolder)
                        os.makedirs(dest_subfolder, exist_ok=True)
                        dest_path = os.path.join(dest_subfolder, filename)
                        if not os.path.exists(dest_path):
                            shutil.copy2(src_path, dest_path)
                        rel_path = f"assets/{subfolder}/{filename}"
                        file_checksum = _sha256_file(dest_path)
                        file_list.append({
                            "path": rel_path,
                            "size": os.path.getsize(dest_path),
                            "checksum": file_checksum,
                        })
                    else:
                        rel_path = old_url
                    
                    media_file_map[old_url] = rel_path

        # ── experience.json ─────────────────────────────────────────────
        # If a runtime_contract (from runtime_contact.py) is provided, rewrite
        # its URLs and write it as experience.json. This is the Runtime v1.0
        # JSON that the Electron runtime will read.
        # If no contract is provided, fall back to the rewritten preview_payload.
        if runtime_contract is not None:
            output_payload = _rewrite_payload_media_urls(runtime_contract, media_file_map)
        else:
            output_payload = _rewrite_payload_media_urls(payload, media_file_map)

        # Rewrite the raw payload for backward-compatible return value
        rewritten_payload = _rewrite_payload_media_urls(payload, media_file_map)

        # Write experience.json at package root
        experience_json_bytes = _json.dumps(output_payload, indent=2, ensure_ascii=False).encode("utf-8")
        experience_json_path = os.path.join(pkg_dir, "experience.json")
        with open(experience_json_path, "wb") as f:
            f.write(experience_json_bytes)
        
        experience_json_checksum = _sha256_bytes(experience_json_bytes)
        file_list.insert(0, {
            "path": "experience.json",
            "size": len(experience_json_bytes),
            "checksum": experience_json_checksum,
        })

        return rewritten_payload, file_list, experience_json_checksum
