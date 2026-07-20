import json as _json
import logging
import os
import re
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def _slugify(text):
    """Simple slug: lowercase, replace spaces/special chars with hyphens."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text[:80]


class ManifestBuilder:
    """
    Component builder for manifest.json generation.
    Constructs the structured manifest.json framework containing version fields,
    release metadata, runtime version, file manifests (indexing experience.json, metadata.json, assets/),
    and checksums.
    """

    def build_manifest(self, experience, version_number, build_number, published_by, file_list, experience_json_checksum, metadata_json_checksum, pkg_dir):
        """
        Constructs the manifest dictionary and writes manifest.json into pkg_dir.
        Returns the manifest dictionary.
        """
        manifest = {
            "package_name": _slugify(experience.title),
            "experience_id": experience.id,
            "experience_title": experience.title,
            "version": version_number,
            "build_number": build_number,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "published_by": str(published_by) if published_by else None,
            "runtime_version": "1.0.0",
            "files": file_list,
            "checksums": {
                "experience_json": experience_json_checksum,
                "metadata_json": metadata_json_checksum,
            }
        }
        
        manifest_bytes = _json.dumps(manifest, indent=2, ensure_ascii=False).encode("utf-8")
        manifest_path = os.path.join(pkg_dir, "manifest.json")
        with open(manifest_path, "wb") as f:
            f.write(manifest_bytes)

        return manifest
