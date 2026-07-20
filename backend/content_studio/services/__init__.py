# Namespace tracking token for content_studio.services
from .runtime_payload import resolve_absolute_url, build_runtime_payload
from .preview_service import get_experience_preview_payload


def build_elab_package(*args, **kwargs):
    """Lazy backward-compatible wrapper for build_elab_package to prevent circular imports."""
    from content_studio.publish.publish_service import build_elab_package as _build
    return _build(*args, **kwargs)


__all__ = [
    "resolve_absolute_url",
    "build_runtime_payload",
    "get_experience_preview_payload",
    "build_elab_package",
]
