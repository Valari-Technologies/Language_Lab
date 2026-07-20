import logging
from content_studio.models import Experience
from .runtime_payload import build_runtime_payload, resolve_absolute_url

logger = logging.getLogger(__name__)


def get_experience_preview_payload(experience_or_id, request=None):
    """
    Thin wrapper service to resolve an Experience instance or ID,
    invoke runtime payload assembly, and return the payload dictionary.
    """
    if isinstance(experience_or_id, (int, str)):
        experience = Experience.objects.get(id=experience_or_id, is_deleted=False)
    else:
        experience = experience_or_id

    return build_runtime_payload(experience, request=request)
