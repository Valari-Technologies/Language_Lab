import hashlib
import json as _json
import logging
import os

logger = logging.getLogger(__name__)


def _sha256_bytes(data: bytes):
    return hashlib.sha256(data).hexdigest()


class MetadataBuilder:
    """
    Component builder for metadata.json generation.
    Extracts high-level manifest markers from the active Experience instance to output metadata.json
    matching the explicit EnglishLab Runtime schema layout.
    """

    def build_metadata(self, experience, version_number, pkg_dir):
        """
        Generates metadata.json at package root.
        Returns (metadata_dict, metadata_json_checksum, metadata_json_size).
        """
        thumbnail_url = ""
        if experience.thumbnail:
            filename = os.path.basename(experience.thumbnail)
            thumbnail_url = f"assets/images/{filename}"

        grade_name = experience.grade.grade_name if experience.grade else None

        metadata = {
            "title": experience.title,
            "grade": grade_name,
            "subject": experience.subject,
            "language": experience.language,
            "difficulty": experience.difficulty,
            "duration": experience.estimated_duration or 0,
            "thumbnail": thumbnail_url,
            "version": version_number
        }

        metadata_json_bytes = _json.dumps(metadata, indent=2, ensure_ascii=False).encode("utf-8")
        metadata_json_path = os.path.join(pkg_dir, "metadata.json")
        with open(metadata_json_path, "wb") as f:
            f.write(metadata_json_bytes)

        metadata_checksum = _sha256_bytes(metadata_json_bytes)
        metadata_size = len(metadata_json_bytes)

        return metadata, metadata_checksum, metadata_size
