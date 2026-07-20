import logging
from content_studio.services.runtime_payload import build_runtime_payload

logger = logging.getLogger(__name__)


class ExperienceBuilder:
    """
    Component builder for Experience payload structures.
    Iterates through Scenarios, Activities, and Screens to build the nested dictionary payload structure.
    No filesystem read/writes, no compression routines.
    """

    def build_payload(self, experience):
        """
        Assembles the runtime experience dictionary payload.
        """
        logger.debug("Building payload dictionary for Experience %s", experience.id)
        return build_runtime_payload(experience, request=None)
