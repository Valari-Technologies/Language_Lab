"""
Student progress and resume positions for the CMS LMS hub.
Same rules as the hub PC (LMS src/main/hub/hubProgress.js, progressMerge.js, hubResume.js); completions are
also saved as StudentAttempt for the CMS reports, like /api/hub/progress/.
"""
import logging
import math
import re
from datetime import timedelta, timezone as dt_timezone

from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from assessments.models import StudentAttempt
from content_studio.models import PublishedPackage
from lms.hub.views import _clean_event, resolve_student_class, save_attempt
from .core import iso
from .models import LmsLevelProgress, LmsProgressEvent, LmsResumePosition, LmsStudentState
from .plans import package_id_for_slot

logger = logging.getLogger(__name__)

EVENT_ID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)
LEVEL_KEY_RE = re.compile(r"^(L([1-9]|[12][0-9]|30)|B[1-6])$")
PACKAGE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
MAX_EVENT_AGE = timedelta(days=30)
FLAG_MAPS = ("playedBossAnimations", "revealedBosses", "assemblyPlayed")


# ---------------------------------------------------------------- merge rules (progressMerge.js)

def clamp_int(value, low, high):
    try:
        number = math.floor(float(value))
    except (TypeError, ValueError, OverflowError):
        number = 0
    return min(high, max(low, number))


def merge_state(base, patch):
    """Grow-only numbers -> MAX, piece lists -> UNION, flags -> OR, anything else -> the newer value."""
    out = dict(base) if isinstance(base, dict) else {}
    if not isinstance(patch, dict):
        return out
    for key, value in patch.items():
        if key == "unlockedLevel":
            out["unlockedLevel"] = max(clamp_int(out.get("unlockedLevel"), 1, 30), clamp_int(value, 1, 30))
        elif key == "stars":
            stars = dict(out["stars"]) if isinstance(out.get("stars"), dict) else {}
            for level, count in (value if isinstance(value, dict) else {}).items():
                stars[level] = max(clamp_int(stars.get(level), 0, 3), clamp_int(count, 0, 3))
            out["stars"] = stars
        elif key == "unlockedPieces":
            pieces = dict(out["unlockedPieces"]) if isinstance(out.get("unlockedPieces"), dict) else {}
            for zone, items in (value if isinstance(value, dict) else {}).items():
                merged = list(pieces[zone]) if isinstance(pieces.get(zone), list) else []
                for piece in items if isinstance(items, list) else []:
                    if piece not in merged:
                        merged.append(piece)
                pieces[zone] = merged
            out["unlockedPieces"] = pieces
        elif key in FLAG_MAPS:
            flags = dict(out[key]) if isinstance(out.get(key), dict) else {}
            for name, flag in (value if isinstance(value, dict) else {}).items():
                flags[name] = bool(flags.get(name)) or bool(flag)
            out[key] = flags
        else:
            out[key] = value
    return out


# ---------------------------------------------------------------- times

def _parse_time(value):
    if not isinstance(value, str):
        return None
    try:
        parsed = parse_datetime(value)
    except ValueError:
        return None
    if parsed is not None and timezone.is_naive(parsed):
        parsed = parsed.replace(tzinfo=dt_timezone.utc)
    return parsed


def corrected_time(value, offset, now):
    """A PC time shifted by the PC clock offset; in the future or older than 30 days -> server time."""
    parsed = _parse_time(value)
    if parsed is not None:
        fixed = parsed + offset
        if now - MAX_EVENT_AGE <= fixed <= now:
            return fixed
    return now


# ---------------------------------------------------------------- progress

def _level_json(row):
    return {
        "level_key": row.level_key,
        "package_id": row.package_id,
        "best_stars": row.best_stars,
        "best_score": row.best_score,
        "completed": row.completed,
        "first_completed_at": iso(row.first_completed_at),
        "last_completed_at": iso(row.last_completed_at),
        "attempts": row.attempts,
        "updated_at": iso(row.updated_at),
    }


def snapshot(student):
    levels = [_level_json(r) for r in LmsLevelProgress.objects.filter(student=student).order_by("level_key")]
    state_row = LmsStudentState.objects.filter(student=student).first()
    return {"levels": levels, "state": state_row.state if state_row else {}}


def _score(value):
    if value is None or value == "" or isinstance(value, (dict, list)):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def apply_event(student, device, body, offline=False):
    """POST progress / offline-progress: one event (completion and/or state). Returns (status, body)."""
    if not isinstance(body, dict):
        return 400, {"ok": False, "error": "invalid_body"}
    event_id = str(body.get("event_id") or "")
    level_key = None if body.get("level_key") is None else str(body.get("level_key"))
    if not EVENT_ID_RE.match(event_id):
        return 400, {"ok": False, "error": "invalid_event_id"}
    if level_key is not None and not LEVEL_KEY_RE.match(level_key):
        return 400, {"ok": False, "error": "invalid_level_key"}
    state_patch = body.get("state_patch")
    if state_patch is not None and not isinstance(state_patch, dict):
        return 400, {"ok": False, "error": "invalid_state_patch"}
    if level_key is None and state_patch is None:
        return 400, {"ok": False, "error": "nothing_to_apply"}

    stars = clamp_int(body.get("stars"), 0, 3)
    score = _score(body.get("score"))
    completed = body.get("completed") is True
    package_id = str(body.get("package_id")) if PACKAGE_ID_RE.match(str(body.get("package_id") or "")) else None
    now = timezone.now()
    sent = _parse_time(body.get("pc_sent_at"))
    offset = (now - sent) if sent else timedelta(0)
    completed_at = None
    started_at = None
    if completed:
        completed_at = corrected_time(body.get("completed_at"), offset, now) if body.get("completed_at") else now
    if body.get("started_at"):
        started_at = corrected_time(body.get("started_at"), offset, now)
    if started_at and completed_at and started_at > completed_at:
        started_at = None
    max_score = body.get("max_score")
    if isinstance(max_score, bool) or not isinstance(max_score, (int, float)) or not math.isfinite(max_score) or max_score <= 0:
        max_score = None
    time_spent = body.get("time_spent_seconds")
    time_spent = min(time_spent, 24 * 3600) if isinstance(time_spent, int) and not isinstance(time_spent, bool) and time_spent >= 0 else None

    package_for_level = (package_id or package_id_for_slot(student, level_key)) if level_key else None
    duplicate = False
    event = None
    with transaction.atomic():
        if LmsProgressEvent.objects.filter(event_id=event_id).exists():
            duplicate = True
        else:
            try:
                with transaction.atomic():
                    event = LmsProgressEvent.objects.create(
                        event_id=event_id,
                        student=student,
                        device=device,
                        type="offline" if offline else ("completion" if level_key else "state"),
                        payload=body,
                        received_at=now,
                        attempt_status="" if level_key else "none",
                    )
            except IntegrityError:
                duplicate = True

        if not duplicate and level_key:
            row, created = LmsLevelProgress.objects.select_for_update().get_or_create(
                student=student,
                level_key=level_key,
                defaults={
                    "package_id": package_for_level,
                    "best_stars": stars,
                    "best_score": score,
                    "completed": completed,
                    "first_completed_at": completed_at,
                    "last_completed_at": completed_at,
                    "attempts": 1,
                    "updated_at": now,
                },
            )
            if not created:
                row.package_id = package_for_level or row.package_id
                row.best_stars = max(row.best_stars, stars)
                if score is not None:
                    row.best_score = score if row.best_score is None else max(row.best_score, score)
                row.completed = row.completed or completed
                if completed_at:
                    if row.first_completed_at is None or completed_at < row.first_completed_at:
                        row.first_completed_at = completed_at
                    if row.last_completed_at is None or completed_at > row.last_completed_at:
                        row.last_completed_at = completed_at
                row.attempts += 1
                row.updated_at = now
                row.save()

        if not duplicate and state_patch is not None:
            state_row, _ = LmsStudentState.objects.select_for_update().get_or_create(
                student=student, defaults={"state": {}, "updated_at": now}
            )
            state_row.state = merge_state(state_row.state, state_patch)
            state_row.updated_at = now
            state_row.save()

    if event is not None and level_key:
        _record_attempt(event, student, {
            "event_id": event_id,
            "level_key": level_key,
            "package_id": package_for_level,
            "stars": stars,
            "score": score,
            "max_score": max_score,
            "completed": completed,
            "completed_at": completed_at,
            "started_at": started_at,
            "time_spent_seconds": time_spent,
        })

    return 200, {"ok": True, "duplicate": duplicate, **snapshot(student)}


def _record_attempt(event, student, data):
    """Save the event as a StudentAttempt for the CMS reports; the result is noted on the event."""
    status, err = _save_attempt(student, data)
    LmsProgressEvent.objects.filter(pk=event.pk).update(attempt_status=status, attempt_error=err[:120])


def _save_attempt(student, data):
    if StudentAttempt.objects.filter(lms_attempt_id=data["event_id"]).exists():
        return "saved", ""
    package_id = data["package_id"]
    pkg = (
        PublishedPackage.objects.select_related("experience").filter(id=int(package_id)).first()
        if package_id and str(package_id).isdigit() else None
    )
    if not pkg or pkg.experience.is_deleted:
        return "rejected", "no CMS package for this level"
    raw = {
        "event_id": data["event_id"],
        "student_id": student.student_id,
        "login_code": student.user.username,
        "experience_id": pkg.experience_id,
        "package_id": pkg.id,
        "level_key": data["level_key"],
        "stars": data["stars"],
        "score": data["score"],
        "max_score": data["max_score"],
        "completed": data["completed"],
        "completed_at": iso(data["completed_at"]),
        "started_at": iso(data["started_at"]),
        "time_spent_seconds": data["time_spent_seconds"],
    }
    try:
        ev = _clean_event(raw)
    except ValueError as exc:
        return "rejected", str(exc)
    class_obj = resolve_student_class(student)
    try:
        save_attempt(student.school, student, pkg.experience, ev, class_obj)
    except IntegrityError:
        if StudentAttempt.objects.filter(lms_attempt_id=data["event_id"]).exists():
            return "saved", ""
        logger.exception("LMS hub: StudentAttempt save failed for event %s", data["event_id"])
        return "rejected", "save_failed"
    except ValueError as exc:
        return "rejected", str(exc)
    return ("saved" if class_obj else "no_class"), ""


# ---------------------------------------------------------------- resume positions (hubResume.js)

def _resume_json(row):
    return {
        "package_id": row.package_id,
        "level_key": row.level_key,
        "package_version": row.package_version,
        "signature": row.signature,
        "activityIndex": row.activity_index,
        "screenIndex": row.screen_index,
        "answeredBlockIds": row.answered_block_ids,
        "updated_at": iso(row.updated_at),
    }


def resume_list(student):
    return [_resume_json(r) for r in LmsResumePosition.objects.filter(student=student).order_by("updated_at")]


def _is_stale(row, session, base):
    """Another session wrote the row after the time the caller last saw -> the caller's position is older."""
    return row is not None and row.session_id != session.id and iso(row.updated_at) != (base or None)


def _small_int(value):
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, float) and value.is_integer():
        return int(value)
    if isinstance(value, str):
        try:
            number = float(value.strip())
        except ValueError:
            return None
        return int(number) if number.is_integer() else None
    return None


def resume_save(student, session, body):
    b = body if isinstance(body, dict) else {}
    package_id = str(b.get("package_id") or "")
    ints = [_small_int(b.get("activityIndex")), _small_int(b.get("screenIndex"))]
    answered = b.get("answeredBlockIds") if isinstance(b.get("answeredBlockIds"), list) else None
    if (
        not PACKAGE_ID_RE.match(package_id)
        or not LEVEL_KEY_RE.match(str(b.get("level_key") or ""))
        or any(n is None or n < 0 or n > 999 for n in ints)
        or answered is None or len(answered) > 500
        or any(not isinstance(x, str) or len(x) > 128 for x in answered)
        or len(str(b.get("signature") or "")) > 300
    ):
        return 400, {"ok": False, "error": "invalid_resume"}
    now = timezone.now()
    with transaction.atomic():
        row = LmsResumePosition.objects.select_for_update().filter(student=student, package_id=package_id).first()
        if _is_stale(row, session, b.get("base_updated_at")):
            return 409, {"ok": False, "error": "stale_position", "updated_at": iso(row.updated_at)}
        LmsResumePosition.objects.update_or_create(
            student=student,
            package_id=package_id,
            defaults={
                "level_key": str(b.get("level_key")),
                "package_version": str(b.get("package_version") or "")[:50],
                "signature": str(b.get("signature") or ""),
                "activity_index": ints[0],
                "screen_index": ints[1],
                "answered_block_ids": answered,
                "session": session,
                "updated_at": now,
            },
        )
    return 200, {"ok": True, "updated_at": iso(now)}


def resume_remove(student, session, package_id, base):
    if not PACKAGE_ID_RE.match(str(package_id or "")):
        return 400, {"ok": False, "error": "invalid_package_id"}
    with transaction.atomic():
        row = LmsResumePosition.objects.select_for_update().filter(student=student, package_id=package_id).first()
        if row is None:
            return 200, {"ok": True, "deleted": False}
        if _is_stale(row, session, base):
            return 409, {"ok": False, "error": "stale_position", "updated_at": iso(row.updated_at)}
        row.delete()
    return 200, {"ok": True, "deleted": True}
