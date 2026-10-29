"""LMS level of a lesson (slot in the level map of its grade): range and uniqueness rules."""
from .models import Experience

LEVEL_LIMITS = {"LESSON": 30, "ASSESSMENT": 6}


def parse_level(experience_type, raw):
    """(level, error) for a level typed by the creator: empty -> (None, None); else a slot of the LMS level map."""
    if raw is None or str(raw).strip() == "":
        return None, None
    limit = LEVEL_LIMITS.get(experience_type, 30)
    kind = "assessment" if experience_type == "ASSESSMENT" else "lesson"
    try:
        level = int(str(raw).strip())
    except ValueError:
        level = 0
    if not 1 <= level <= limit:
        return None, f"Level must be a whole number from 1 to {limit} for a {kind}."
    return level, None


def level_taken_by(grade, experience_type, level, exclude_pk=None):
    """Another lesson of the same grade and type that already has (or is waiting for) this LMS level, or None."""
    others = Experience.objects.filter(grade=grade, experience_type=experience_type).exclude(is_deleted=True)
    if exclude_pk:
        others = others.exclude(pk=exclude_pk)
    return (
        others.filter(level=level).first()
        or others.filter(status="PENDING_APPROVAL", pending_level=level).first()
    )
