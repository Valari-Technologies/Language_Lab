import hashlib
import logging
import os
import shutil
import tempfile
import zipfile
from django.conf import settings as django_settings

logger = logging.getLogger(__name__)


def _sha256_file(path):
    """Compute SHA-256 of a file on disk."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _slugify(text):
    """Simple slug: lowercase, replace spaces/special chars with hyphens."""
    import re
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text[:80]


class ZipBuilder:
    """
    Component builder for archive creation and temporary workspace handling.
    Manages the temp execution space, directory compression loops, .elab naming pattern,
    checksum computation, atomic target placement, and workspace cleanup.
    """

    def create_temp_workspace(self):
        """
        Creates a temporary directory and nested package directory for build execution.
        Returns (tmp_dir, pkg_dir).
        """
        tmp_dir = tempfile.mkdtemp(prefix="elab_build_")
        pkg_dir = os.path.join(tmp_dir, "package")
        os.makedirs(pkg_dir, exist_ok=True)
        return tmp_dir, pkg_dir

    def get_packages_root(self):
        """
        Resolves and creates the final PACKAGES_ROOT directory.
        """
        packages_root = getattr(django_settings, "PACKAGES_ROOT", None) or os.path.join(
            django_settings.MEDIA_ROOT, "packages"
        )
        os.makedirs(packages_root, exist_ok=True)
        return packages_root

    def compress_package(self, pkg_dir, tmp_dir, experience_title, version_number):
        """
        Compresses pkg_dir contents into an .elab package inside tmp_dir.
        Returns (tmp_elab_path, elab_filename, elab_checksum, elab_size).
        """
        experience_slug = _slugify(experience_title)
        elab_filename = f"{experience_slug}_v{version_number}.elab"
        tmp_elab_path = os.path.join(tmp_dir, elab_filename)

        with zipfile.ZipFile(tmp_elab_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, dirs, files in os.walk(pkg_dir):
                for fname in files:
                    abs_path = os.path.join(root, fname)
                    arcname = os.path.relpath(abs_path, pkg_dir)
                    zf.write(abs_path, arcname)

        elab_checksum = _sha256_file(tmp_elab_path)
        elab_size = os.path.getsize(tmp_elab_path)

        return tmp_elab_path, elab_filename, elab_checksum, elab_size

    def finalize_package(self, tmp_elab_path, elab_filename, packages_root):
        """
        Moves the temporary .elab file to the final PACKAGES_ROOT location atomically.
        Returns final_elab_path.
        """
        final_elab_path = os.path.join(packages_root, elab_filename)
        if os.path.exists(final_elab_path):
            try:
                os.remove(final_elab_path)
            except OSError:
                pass
        shutil.move(tmp_elab_path, final_elab_path)
        return final_elab_path

    def cleanup(self, tmp_dir, tmp_elab_path=None):
        """
        Cleans up temporary directory and temporary archive files.
        """
        if tmp_elab_path and os.path.exists(tmp_elab_path):
            try:
                os.remove(tmp_elab_path)
            except OSError:
                pass
        if tmp_dir and os.path.exists(tmp_dir):
            try:
                shutil.rmtree(tmp_dir, ignore_errors=True)
            except OSError:
                pass
