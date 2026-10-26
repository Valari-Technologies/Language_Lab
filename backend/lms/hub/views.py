import re
import time
import uuid
import logging
from decimal import Decimal, InvalidOperation

from django.contrib.auth import authenticate, get_user_model
from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.scoping import get_user_school
from assessments.models import ExperienceAssignment, StudentAttempt, ScreenResponse
from content_studio.models import Experience, PublishedPackage
from lms.models import StudentProgress
from lms.packages.views import resolve_grade
from school_admin.models import Class
from super_admin.models import SchoolAdminProfile
from teacher.models import Student
from .auth import get_registered_hub

logger = logging.getLogger(__name__)

MAX_BATCH = 500
LEVEL_KEY_RE = re.compile(r"^(L([1-9]|[12][0-9]|30)|B[1-6])$")

# A row can commit a moment after a GET runs, with a synced_at just before that GET's
# server_time, and so fall outside the next `since` window. The hub must re-read from
# (last since - OVERLAP_SECONDS) and ignore event_ids it already has.
OVERLAP_SECONDS = 300

# Failed admin checks allowed per hub installation in one window.
VERIFY_MAX_FAILURES = 10
VERIFY_WINDOW_SECONDS = 15 * 60
MAX_PASSWORD_LENGTH = 256


def _hub_forbidden():
    return Response({"error": "hub_not_registered"}, status=status.HTTP_403_FORBIDDEN)


def _section_letter(text):
    """'A', 'Section A', 'Class 3-A' -> 'A'; '' when no single section letter is found."""
    name = str(text or "").strip().upper()
    if name.startswith("SECTION"):
        name = name[len("SECTION"):].strip()
    if "-" in name:
        name = name.split("-")[-1].strip()
    if len(name) == 1 and name.isalpha():
        return name
    if len(name) > 1 and name[-1].isalpha() and not name[-2].isalpha():
        return name[-1]
    return ""


def _normalize_year(text):
    return str(text or "").replace(" ", "").upper()


def resolve_student_class(student):
    """
    Match a student to one active class of their school: same grade (resolve_grade)
    and same section letter, preferring the same academic year. None when nothing matches.
    """
    grade = resolve_grade(student)
    section = _section_letter(student.section)
    if not grade or not section:
        return None
    candidates = [
        c for c in Class.objects.filter(school=student.school, grade=grade, is_active=True).order_by("class_id")
        if _section_letter(c.class_name) == section
    ]
    if not candidates:
        return None
    year = _normalize_year(student.academic_year)
    same_year = [c for c in candidates if year and _normalize_year(c.academic_year) == year]
    return (same_year or candidates)[0]


def _decimal(value, name, minimum=None):
    if value is None:
        return None
    try:
        number = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise ValueError(f"{name} must be a number.")
    if not number.is_finite():
        raise ValueError(f"{name} must be a number.")
    if minimum is not None and number < minimum:
        raise ValueError(f"{name} must be at least {minimum}.")
    return number


def _clean_event(raw):
    """Validate one progress event; raises ValueError with a short message."""
    if not isinstance(raw, dict):
        raise ValueError("Event must be an object.")
    try:
        event_id = str(uuid.UUID(str(raw.get("event_id"))))
    except (ValueError, TypeError, AttributeError):
        raise ValueError("event_id must be a UUID.")

    try:
        student_id = int(raw.get("student_id"))
    except (TypeError, ValueError):
        raise ValueError("student_id must be an integer.")
    login_code = str(raw.get("login_code") or "").strip()
    if not login_code:
        raise ValueError("login_code is required.")

    try:
        experience_id = int(raw.get("experience_id"))
    except (TypeError, ValueError):
        raise ValueError("experience_id must be an integer.")
    package_id = raw.get("package_id")
    if package_id not in (None, ""):
        try:
            package_id = int(package_id)
        except (TypeError, ValueError):
            raise ValueError("package_id must be an integer.")
    else:
        package_id = None

    level_key = raw.get("level_key")
    if level_key in (None, ""):
        level_key = None
    elif not LEVEL_KEY_RE.match(str(level_key)):
        raise ValueError("level_key must be L1-L30 or B1-B6.")

    stars = raw.get("stars")
    if stars is not None:
        if isinstance(stars, bool) or not isinstance(stars, int) or not 0 <= stars <= 5:
            raise ValueError("stars must be an integer from 0 to 5.")

    completed = raw.get("completed")
    if not isinstance(completed, bool):
        raise ValueError("completed must be true or false.")

    completed_at = None
    if raw.get("completed_at"):
        completed_at = parse_datetime(str(raw["completed_at"]))
        if completed_at is None:
            raise ValueError("completed_at must be an ISO date-time.")
    elif completed:
        raise ValueError("completed_at is required when completed is true.")

    started_at = None
    if raw.get("started_at"):
        started_at = parse_datetime(str(raw["started_at"]))
        if started_at is None:
            raise ValueError("started_at must be an ISO date-time.")

    score = _decimal(raw.get("score"), "score", Decimal("0"))
    max_score = _decimal(raw.get("max_score"), "max_score")
    if max_score is not None and max_score <= 0:
        raise ValueError("max_score must be greater than 0.")
    if score is not None and max_score is None:
        max_score = Decimal("100")
    if score is not None and score > max_score:
        raise ValueError("score cannot be greater than max_score.")
    percentage = None
    if score is not None:
        percentage = round(score / max_score * 100, 2)

    time_spent = raw.get("time_spent_seconds")
    if time_spent is not None:
        if isinstance(time_spent, bool) or not isinstance(time_spent, int) or time_spent < 0:
            raise ValueError("time_spent_seconds must be a non-negative integer.")

    screens = raw.get("screens") or []
    if not isinstance(screens, list):
        raise ValueError("screens must be a list.")

    return {
        "event_id": event_id,
        "student_id": student_id,
        "login_code": login_code,
        "experience_id": experience_id,
        "package_id": package_id,
        "level_key": level_key,
        "stars": stars,
        "completed": completed,
        "completed_at": completed_at,
        "started_at": started_at or completed_at or timezone.now(),
        "score": score,
        "max_score": max_score,
        "percentage": percentage,
        "time_spent_seconds": time_spent,
        "screens": screens,
    }


def save_attempt(school, student, experience, ev, class_obj):
    """
    Save one cleaned progress event (see _clean_event) as a StudentAttempt with its screen responses,
    and update StudentProgress. Used by /api/hub/progress/ and the CMS LMS hub (lmshub).
    Raises IntegrityError when lms_attempt_id (the event id) already exists.
    """
    with transaction.atomic():
        assignment = (
            ExperienceAssignment.objects.filter(
                school=school, experience_ref=str(experience.id), class_obj=class_obj
            ).order_by("id").first()
        )
        if assignment is None:
            assignment = ExperienceAssignment.objects.create(
                school=school,
                experience_ref=str(experience.id),
                experience_title=experience.title,
                grade=experience.grade,
                class_obj=class_obj,
                assigned_at=ev["started_at"],
            )

        attempt = StudentAttempt.objects.create(
            lms_attempt_id=ev["event_id"],
            assignment=assignment,
            student=student.user,
            school=school,
            started_at=ev["started_at"],
            completed_at=ev["completed_at"],
            status="COMPLETED" if ev["completed"] else "IN_PROGRESS",
            total_score=ev["score"],
            max_score=ev["max_score"],
            percentage=ev["percentage"],
            time_spent_seconds=ev["time_spent_seconds"],
            stars=ev["stars"],
            level_key=ev["level_key"],
        )

        for index, screen in enumerate(ev["screens"]):
            if not isinstance(screen, dict):
                continue
            ScreenResponse.objects.create(
                attempt=attempt,
                school=school,
                screen_ref=str(screen.get("screen_id") or screen.get("screen_ref") or index),
                screen_title=str(screen.get("screen_title") or "")[:255],
                screen_type=str(screen.get("screen_type") or "")[:100],
                response_data=screen.get("details") if isinstance(screen.get("details"), dict) else {},
                score=_decimal(screen.get("score"), "screen score"),
                max_score=_decimal(screen.get("max_score"), "screen max_score"),
                is_correct=screen.get("is_correct") if isinstance(screen.get("is_correct"), bool) else None,
                time_spent_seconds=screen.get("time_spent_seconds") if isinstance(screen.get("time_spent_seconds"), int) else None,
            )

        progress, created = StudentProgress.objects.get_or_create(
            student=student,
            scenario_id=str(experience.id),
            defaults={"completed": ev["completed"], "total_time_spent": ev["time_spent_seconds"] or 0},
        )
        if not created:
            progress.completed = progress.completed or ev["completed"]
            progress.total_time_spent += ev["time_spent_seconds"] or 0
            progress.save()
    return attempt


class HubProgressAPIView(APIView):
    """
    School hub progress sync.
    `POST /api/hub/progress/`  {"events": [...]} (max 500) -> idempotent save by event_id.
    `GET  /api/hub/progress/?since=<ISO>&limit=500&cursor=` -> the school's attempts.
    Auth: registered hub headers (X-School-ID, X-License-ID, X-Installation-ID).
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        school, _server = get_registered_hub(request)
        if not school:
            return _hub_forbidden()

        events = request.data.get("events") if isinstance(request.data, dict) else None
        if not isinstance(events, list):
            return Response({"error": "events must be a list."}, status=status.HTTP_400_BAD_REQUEST)
        if len(events) > MAX_BATCH:
            return Response(
                {"error": "batch_too_large", "max": MAX_BATCH, "received": len(events)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        accepted, duplicates, rejected, no_class = [], [], [], []
        class_cache = {}

        for raw in events:
            raw_id = str(raw.get("event_id") or "") if isinstance(raw, dict) else ""
            try:
                ev = _clean_event(raw)
            except ValueError as exc:
                rejected.append({"event_id": raw_id, "error": str(exc)})
                continue

            if StudentAttempt.objects.filter(lms_attempt_id=ev["event_id"]).exists():
                duplicates.append(ev["event_id"])
                continue

            student = (
                Student.objects.select_related("user", "school")
                .filter(student_id=ev["student_id"], school=school)
                .first()
            )
            if not student or not student.user.is_active:
                rejected.append({"event_id": ev["event_id"], "error": "student_not_found"})
                continue
            if student.user.username.lower() != ev["login_code"].lower():
                rejected.append({"event_id": ev["event_id"], "error": "login_code_mismatch"})
                continue

            experience = Experience.objects.filter(id=ev["experience_id"]).exclude(is_deleted=True).first()
            if not experience:
                rejected.append({"event_id": ev["event_id"], "error": "experience_not_found"})
                continue
            if ev["package_id"] is not None and not PublishedPackage.objects.filter(
                id=ev["package_id"], experience=experience
            ).exists():
                rejected.append({"event_id": ev["event_id"], "error": "package_mismatch"})
                continue

            if student.student_id not in class_cache:
                class_cache[student.student_id] = resolve_student_class(student)
            class_obj = class_cache[student.student_id]

            try:
                save_attempt(school, student, experience, ev, class_obj)
            except IntegrityError:
                if StudentAttempt.objects.filter(lms_attempt_id=ev["event_id"]).exists():
                    duplicates.append(ev["event_id"])
                else:
                    logger.exception("Hub progress save failed for event %s", ev["event_id"])
                    rejected.append({"event_id": ev["event_id"], "error": "save_failed"})
                continue
            except ValueError as exc:
                rejected.append({"event_id": ev["event_id"], "error": str(exc)})
                continue

            accepted.append(ev["event_id"])
            if class_obj is None and student.user.username not in no_class:
                no_class.append(student.user.username)

        return Response(
            {"accepted": accepted, "duplicates": duplicates, "rejected": rejected, "no_class": no_class},
            status=status.HTTP_200_OK,
        )

    def get(self, request, *args, **kwargs):
        school, _server = get_registered_hub(request)
        if not school:
            return _hub_forbidden()

        server_time = timezone.now()
        since_raw = request.GET.get("since")
        since = parse_datetime(since_raw) if since_raw else None
        if since_raw and since is None:
            return Response({"error": "since must be an ISO date-time."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            limit = max(1, min(MAX_BATCH, int(request.GET.get("limit", MAX_BATCH))))
        except ValueError:
            return Response({"error": "limit must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        qs = (
            StudentAttempt.objects.filter(school=school)
            .exclude(lms_attempt_id__startswith="DEMO")
            .select_related("assignment", "student")
        )
        if since:
            qs = qs.filter(synced_at__gt=since)

        cursor = request.GET.get("cursor")
        if cursor:
            try:
                cursor_ts_raw, cursor_id_raw = cursor.rsplit("|", 1)
                cursor_ts, cursor_id = parse_datetime(cursor_ts_raw), int(cursor_id_raw)
                if cursor_ts is None:
                    raise ValueError
            except ValueError:
                return Response({"error": "cursor is invalid."}, status=status.HTTP_400_BAD_REQUEST)
            qs = qs.filter(Q(synced_at__gt=cursor_ts) | Q(synced_at=cursor_ts, id__gt=cursor_id))

        rows = list(qs.order_by("synced_at", "id")[: limit + 1])
        has_more = len(rows) > limit
        rows = rows[:limit]

        student_ids = dict(
            Student.objects.filter(school=school, user_id__in=[r.student_id for r in rows])
            .values_list("user_id", "student_id")
        )
        exp_ids = [int(r.assignment.experience_ref) for r in rows if str(r.assignment.experience_ref).isdigit()]
        package_ids = dict(
            PublishedPackage.objects.filter(experience_id__in=exp_ids).values_list("experience_id", "id")
        )

        attempts = []
        for r in rows:
            ref = r.assignment.experience_ref
            experience_id = int(ref) if str(ref).isdigit() else None
            attempts.append({
                "event_id": r.lms_attempt_id,
                "student_id": student_ids.get(r.student_id),
                "login_code": r.student.username,
                "experience_id": experience_id,
                "package_id": package_ids.get(experience_id),
                "level_key": r.level_key,
                "stars": r.stars,
                "score": float(r.total_score) if r.total_score is not None else None,
                "max_score": float(r.max_score) if r.max_score is not None else None,
                "percentage": float(r.percentage) if r.percentage is not None else None,
                "completed": r.status == "COMPLETED",
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
                "time_spent_seconds": r.time_spent_seconds,
                "synced_at": r.synced_at.isoformat(),
            })

        next_cursor = f"{rows[-1].synced_at.isoformat()}|{rows[-1].id}" if has_more and rows else None
        return Response(
            {
                "server_time": server_time.isoformat(),
                # Re-read from (last since - overlap_seconds) and ignore event_ids already held;
                # see OVERLAP_SECONDS above for why.
                "overlap_seconds": OVERLAP_SECONDS,
                "attempts": attempts,
                "next": next_cursor,
            },
            status=status.HTTP_200_OK,
        )


def _verify_fail_key(installation_id):
    return f"hub_admin_verify_fail:{installation_id}"


def _record_verify_failure(installation_id):
    """Count a failed admin check; the window starts at the first failure."""
    key = _verify_fail_key(installation_id)
    now = time.time()
    entry = cache.get(key)
    if not entry or entry["reset_at"] <= now:
        entry = {"count": 0, "reset_at": now + VERIFY_WINDOW_SECONDS}
    entry["count"] += 1
    cache.set(key, entry, timeout=max(1, int(entry["reset_at"] - now)))


class HubAdminVerifyAPIView(APIView):
    """
    School admin check before the hub window opens.
    `POST /api/hub/admin/verify/` {"email": "<email or username>", "password": "..."}
    Auth: registered hub headers. Returns no tokens; the hub keeps only a password hash.
    Never log the request body: it carries a password.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        school, _server = get_registered_hub(request)
        if not school:
            return _hub_forbidden()
        installation_id = str(request.headers.get("X-Installation-ID") or "").strip()

        data = request.data if isinstance(request.data, dict) else {}
        identifier = data.get("email")
        password = data.get("password")
        if (
            not isinstance(identifier, str) or not identifier.strip()
            or not isinstance(password, str) or not password
            or len(password) > MAX_PASSWORD_LENGTH
        ):
            return Response({"error": "invalid_body"}, status=status.HTTP_400_BAD_REQUEST)
        identifier = identifier.strip()

        key = _verify_fail_key(installation_id)
        now = time.time()
        entry = cache.get(key)
        if entry and entry["reset_at"] > now and entry["count"] >= VERIFY_MAX_FAILURES:
            return Response(
                {"error": "too_many_attempts", "retry_after": max(1, int(entry["reset_at"] - now))},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        def fail(error, http_status):
            _record_verify_failure(installation_id)
            return Response({"error": error}, status=http_status)

        User = get_user_model()
        candidate = (
            User.objects.filter(email__iexact=identifier).first()
            or User.objects.filter(username__iexact=identifier).first()
        )
        # Always run authenticate() so unknown users cost the same hashing time as known ones.
        user = authenticate(
            request=request,
            username=candidate.username if candidate else identifier,
            password=password,
        )
        if user is None and candidate is not None and not candidate.is_active and candidate.check_password(password):
            # ModelBackend refuses inactive users; with the right password, report the role problem instead.
            user = candidate
        if user is None:
            return fail("invalid_credentials", status.HTTP_401_UNAUTHORIZED)

        if (
            not user.is_active
            or user.role != "SCHOOL_ADMIN"
            or not SchoolAdminProfile.objects.filter(user=user).exists()
        ):
            return fail("not_school_admin", status.HTTP_403_FORBIDDEN)

        admin_school = get_user_school(user)
        if admin_school is None or admin_school.pk != school.pk or not admin_school.is_active:
            return fail("wrong_school", status.HTTP_403_FORBIDDEN)

        cache.delete(key)
        return Response(
            {
                "ok": True,
                "admin": {
                    "username": user.username,
                    "email": user.email or "",
                    "full_name": user.full_name or "",
                },
                "school": {"schoolId": school.schoolId, "name": school.school_name},
            },
            status=status.HTTP_200_OK,
        )
