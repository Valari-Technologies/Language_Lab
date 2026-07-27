"""
EnglishLab Runtime Specification v1.0

This module is the ONLY place responsible for converting CMS authoring
data into the Runtime JSON contract.

CMS → Runtime Contract → Electron Runtime
"""

RUNTIME_VERSION = "1.0.0"


SCREEN_TYPE_MAP = {
    "INFORMATION": "text",
    "IMAGE": "image",
    "VIDEO": "video",
    "AUDIO": "audio",
    "QUIZ": "mcq",
    "SPEAKING": "recording",
    "WRITING": "input",
}


def build_runtime_experience(experience, preview_payload):

    metadata = preview_payload["experience"]

    runtime = {
        "schemaVersion": RUNTIME_VERSION,
        "version": RUNTIME_VERSION,

        "id": str(metadata["id"]),
        "title": metadata["title"],
        "description": metadata.get("description", ""),

        "language": metadata.get("language", "en"),
        "grade": metadata.get("grade"),
        "subject": metadata.get("subject", ""),
        "estimatedDuration": metadata.get("estimated_duration", 0),

        "activities": []
    }

    for activity in preview_payload.get("activities", []):

        runtime_activity = {
            "id": str(activity["id"]),
            "title": activity.get("title", ""),
            "description": activity.get("description", ""),
            "sequence": activity.get("display_order", 0),
            "estimatedDuration": activity.get("estimated_duration", 0),
            "skills": activity.get("skills", []),
            "screens": []
        }

        for screen in activity.get("screens", []):

            content = dict(screen.get("content") or {})

            runtime_type = (
                content.pop("runtime_type", None)
                or SCREEN_TYPE_MAP.get(
                    screen.get("screen_type"),
                    "text"
                )
            )

            runtime_screen = {
                "id": str(screen["id"]),
                "title": screen.get("title", ""),
                "type": runtime_type,

                # Runtime v1 Standard
                "content": content,

                # Optional debug / asset information
                "resolvedMedia": screen.get("resolved_media", [])
            }

            attach_primary_media(runtime_screen)

            runtime_activity["screens"].append(runtime_screen)

        runtime["activities"].append(runtime_activity)

    return runtime


def attach_primary_media(screen):
    """
    Convenience mapping.

    Copies the first media path into screen.content so renderers
    never need to inspect resolvedMedia.
    """

    content = screen["content"]

    key_map = {
        "IMAGE": "image",
        "VIDEO": "video",
        "AUDIO": "audio",
        "DOCUMENT": "document",
    }

    for media in screen.get("resolvedMedia", []):

        if media.get("missing"):
            continue

        media_key = key_map.get(media.get("type"))

        if not media_key:
            continue

        if media_key not in content:
            content[media_key] = media.get("url")