"""
CMS LMS hub: the API the school hub PC offered to student PCs, served by the CMS under /api/lms-hub/.
Same request/response JSON and error codes as the hub (LMS src/main/hub/hubServer.js).
"""
import functools
import hmac
import logging
import re
from datetime import timedelta

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from super_admin.models import School
from teacher.models import Student
from . import plans, progress
from .core import (
    BodyError, PC_ID_RE, active_session, client_ip, current_pairing_code, device_for_token, error, expire_stale, hub_name, license_state, new_token, open_sessions, rate_limit, read_json, reply, seat_total,
    seats_used, session_for, sha256_hex, student_payload_grade, throttle_clear, throttle_fail, throttle_wait,
    touch_device,
)
from .models import LmsDevice, LmsSession

logger = logging.getLogger(__name__)

MAX_WRONG_CODES = 5
PAIR_LOCK_SECONDS = 300
MAX_LOGIN_FAILURES = 5
LOGIN_LOCK_SECONDS = 10
OFFLINE_DATA_PER_HOUR = 30


def hub_endpoint(methods, device_required=True):
    """JSON errors like the hub, device auth (X-Hub-Token) and last-seen tracking."""
    def decorator(view):
        @csrf_exempt
        @functools.wraps(view)
        def wrapper(request, *args, **kwargs):
            try:
                if request.method not in methods:
                    return error(404, "not_found")
                if not device_required:
                    return view(request, *args, **kwargs)
                device = device_for_token(request.headers.get("X-Hub-Token"))
                if not device:
                    return error(401, "not_paired")
                if device.revoked:
                    return error(401, "revoked")
                touch_device(device, client_ip(request))
                expire_stale()
                return view(request, device, *args, **kwargs)
            except BodyError as exc:
                return error(exc.status, exc.code)
            except Exception:
                logger.exception("LMS hub request failed: %s %s", request.method, request.path)
                return error(500, "server_error")
        return wrapper
    return decorator


def _session_token(request):
    return request.headers.get("X-Session-Token")


def _session_student(device, session):
    """The session's student if still active in the PC's school, else None."""
    student = session.student
    if not student.user.is_active or student.school_id != device.school_id:
        return None
    return student


# ---------------------------------------------------------------- open routes

@hub_endpoint({"GET"}, device_required=False)
def health(request):
    device = device_for_token(request.headers.get("X-Hub-Token"))
    school = device.school if device and not device.revoked else None
    return reply(200, {
        "ok": True,
        "mode": "hub",
        "hubName": hub_name(school) if school else "CMS",
        "schoolId": school.schoolId if school else None,
        "appVersion": "cms",
    })


@hub_endpoint({"POST"}, device_required=False)
def pair(request):
    ip = client_ip(request) or "unknown"
    key = f"pair:{ip}"
    wait = throttle_wait(key)
    if wait:
        return error(429, "too_many_attempts", retryAfterSec=wait)
    body = read_json(request)
    if not isinstance(body, dict):
        body = {}
    pc_id = str(body.get("pcId") or "")
    if not PC_ID_RE.match(pc_id):
        return error(400, "invalid_pc_id")

    school_code = str(body.get("schoolCode") or "").strip()
    school = (
        School.objects.filter(Q(schoolId__iexact=school_code) | Q(school_code__iexact=school_code), is_active=True).first()
        if school_code else None
    )
    typed = str(body.get("pairingCode") or "").strip()
    expected = current_pairing_code(school).code if school else None
    # An unknown school answers like a wrong code, so school codes cannot be probed
    if not school or not hmac.compare_digest(typed.encode(), expected.encode()):
        throttle_fail(key, MAX_WRONG_CODES, PAIR_LOCK_SECONDS)
        return error(403, "wrong_code")
    throttle_clear(key)

    pc_name = re.sub(r"[\x00-\x1f]", "", str(body.get("pcName") or "")).strip()[:64] or "Student PC"
    token = new_token()
    now = timezone.now()
    # Pairing again (also after "Remove") re-enables the computer with a new token
    LmsDevice.objects.update_or_create(
        school=school,
        pc_id=pc_id,
        defaults={"pc_name": pc_name, "token_hash": sha256_hex(token), "paired_at": now, "last_seen": now,
                  "last_ip": client_ip(request), "revoked": False},
    )
    return reply(200, {"ok": True, "hubToken": token, "hubName": hub_name(school)})


# ---------------------------------------------------------------- device routes

@hub_endpoint({"GET"})
def whoami(request, device):
    return reply(200, {"ok": True, "pcId": str(device.pc_id), "pcName": device.pc_name})


@hub_endpoint({"GET"})
def status_view(request, device):
    state = license_state(device.school)
    return reply(200, {
        "ok": True,
        "licenseActive": state["active"],
        "expired": state["expired"],
        "schoolName": device.school.school_name,
        "seats": {"used": seats_used(device.school), "total": seat_total(state)},
        "setupCompleted": True,
    })


@hub_endpoint({"POST"})
def login(request, device):
    body = read_json(request)
    body = body if isinstance(body, dict) else {}
    code = str(body.get("code") or "").strip()
    if not code or len(code) > 64:
        return error(400, "code_required")
    key = f"login:{device.id}"
    wait = throttle_wait(key)
    if wait:
        return error(429, "locked", retryAfterSec=wait)

    state = license_state(device.school)
    if state["expired"]:
        return error(403, "license_expired")
    if not state["active"]:
        return error(403, "not_activated")

    # Only active students of this PC's school, by login code (username)
    student = (
        Student.objects.select_related("user")
        .filter(school=device.school, user__username__iexact=code, user__is_active=True)
        .order_by("student_id")
        .first()
    )
    if not student:
        locked, retry_after, remaining = throttle_fail(key, MAX_LOGIN_FAILURES, LOGIN_LOCK_SECONDS)
        if locked:
            return error(429, "locked", retryAfterSec=retry_after)
        return error(404, "invalid_code", attemptsRemaining=remaining)
    throttle_clear(key)

    # Silent re-login after a connection gap: never take the seat back from a PC the student uses now
    if body.get("rejoin") is True:
        if open_sessions(device.school).filter(student=student).exclude(device=device).exists():
            return error(409, "session_elsewhere")

    total = seat_total(state)
    if not total:
        return error(503, "seats_unknown")

    token = new_token()
    now = timezone.now()
    with transaction.atomic():
        School.objects.select_for_update().get(pk=device.school_id)  # one seat count at a time per school
        expire_stale()
        # This student's other session and this PC's other session end below, so they don't count
        used = open_sessions(device.school).exclude(student=student).exclude(device=device).count()
        if used >= total:
            return error(409, "seats_full", used=used, total=total)
        LmsSession.objects.filter(ended_at__isnull=True, student=student).update(ended_at=now, end_reason="replaced")
        LmsSession.objects.filter(ended_at__isnull=True, device=device).update(ended_at=now, end_reason="pc_new_login")
        LmsSession.objects.create(token_hash=sha256_hex(token), student=student, device=device,
                                  created_at=now, last_heartbeat=now)

    grade, grade_number = student_payload_grade(student)
    user = student.user
    return reply(200, {
        "ok": True,
        "sessionToken": token,
        "student": {
            "id": student.student_id,
            "name": user.full_name or user.username,
            "login_code": user.username,
            "grade": grade,
            "grade_number": grade_number,
        },
    })


@hub_endpoint({"POST"})
def heartbeat(request, device):
    session, err = session_for(device, _session_token(request))
    if err:
        return error(401, err)
    if session.ended_at is None and session.last_heartbeat < timezone.now() - timedelta(seconds=120):
        expire_stale()
        return error(401, "session_expired")
    if session.ended_at:
        return error(401, "session_replaced" if session.end_reason == "replaced" else "session_expired")
    LmsSession.objects.filter(pk=session.pk).update(last_heartbeat=timezone.now())
    return reply(200, {"ok": True})


@hub_endpoint({"POST"})
def logout(request, device):
    session, err = session_for(device, _session_token(request))
    if err == "session_wrong_pc":
        return error(401, err)
    if session and not session.ended_at:
        LmsSession.objects.filter(pk=session.pk).update(ended_at=timezone.now(), end_reason="logout")
    return reply(200, {"ok": True})


@hub_endpoint({"GET"})
def level_plan(request, device):
    session, err = active_session(device, _session_token(request))
    if err:
        return error(401, err)
    student = _session_student(device, session)
    if not student:
        return error(404, "student_not_found")
    status_code, body = plans.plan_for_student(student)
    return reply(status_code, body)


@hub_endpoint({"GET"})
def student_package(request, device, package_id):
    session, err = active_session(device, _session_token(request))
    if err:
        return error(401, err)
    student = _session_student(device, session)
    if not student:
        return error(404, "student_not_found")
    return plans.package_response(request, package_id, plans.package_ids_for_student(student))


@hub_endpoint({"GET"})
def device_package(request, device, package_id):
    return plans.package_response(request, package_id, plans.package_ids_for_school(device.school))


@hub_endpoint({"GET", "POST"})
def progress_view(request, device):
    session, err = active_session(device, _session_token(request))
    if err:
        return error(401, err)
    student = _session_student(device, session)
    if not student:
        return error(404, "student_not_found")
    if request.method == "GET":
        return reply(200, {"ok": True, **progress.snapshot(student)})
    status_code, body = progress.apply_event(student, device, read_json(request))
    return reply(status_code, body)


@hub_endpoint({"GET", "PUT"})
def resume(request, device):
    session, err = active_session(device, _session_token(request))
    if err:
        if request.method == "GET":
            return error(401, err)
        return error(409, "stale_session", reason=err)
    if request.method == "GET":
        return reply(200, {"ok": True, "positions": progress.resume_list(session.student)})
    status_code, body = progress.resume_save(session.student, session, read_json(request))
    return reply(status_code, body)


@hub_endpoint({"DELETE"})
def resume_delete(request, device, package_id):
    session, err = active_session(device, _session_token(request))
    if err:
        return error(409, "stale_session", reason=err)
    status_code, body = progress.resume_remove(session.student, session, package_id, request.GET.get("base") or None)
    return reply(status_code, body)


# ---------------------------------------------------------------- offline copy

def code_key(device_token, login_code):
    """HMAC-SHA256 of the upper-case login code, keyed with this PC's device token."""
    return hmac.new(str(device_token).encode(), str(login_code or "").strip().upper().encode(), "sha256").hexdigest()


@hub_endpoint({"GET"})
def offline_data(request, device):
    wait = rate_limit(f"offline:{device.id}", OFFLINE_DATA_PER_HOUR, 3600)
    if wait:
        return error(429, "too_many_requests", retryAfterSec=wait)
    state = license_state(device.school)
    if not state["active"]:
        return error(403, "not_activated")

    token = request.headers.get("X-Hub-Token")
    plans_by_grade = {}
    students = []
    for student in (
        Student.objects.select_related("user")
        .filter(school=device.school, user__is_active=True)
        .order_by("student_id")
    ):
        status_code, body = plans.plan_for_student(student)
        grade_id = None
        if status_code == 200:
            grade_id = str(body["grade"]["id"])
            if grade_id not in plans_by_grade:
                plans_by_grade[grade_id] = {k: v for k, v in body.items() if k != "student"}
        grade, grade_number = student_payload_grade(student)
        students.append({
            "id": student.student_id,
            "name": student.user.full_name or student.user.username,
            "grade": grade,
            "grade_number": grade_number,
            "gradeId": grade_id,
            "planError": None if status_code == 200 else body.get("error") or "plan_not_available",
            "codeKeys": [code_key(token, student.user.username)],
            "progress": progress.snapshot(student),
        })
    return reply(200, {
        "ok": True,
        "generatedAt": timezone.now().isoformat(),
        "schoolName": device.school.school_name,
        "students": students,
        "plans": plans_by_grade,
    })


@hub_endpoint({"POST"})
def offline_progress(request, device):
    body = read_json(request)
    if not isinstance(body, dict) or not isinstance(body.get("event"), dict):
        return error(400, "invalid_body")
    if license_state(device.school)["license"] is None:
        return error(403, "not_activated")
    raw_id = str(body.get("student_id") or "")
    student = (
        Student.objects.select_related("user", "school")
        .filter(school=device.school, student_id=int(raw_id), user__is_active=True)
        .first()
        if raw_id.isdigit() else None
    )
    expected = code_key(request.headers.get("X-Hub-Token"), student.user.username) if student else ""
    if not student or not hmac.compare_digest(str(body.get("code_key") or "").encode(), expected.encode()):
        return error(404, "student_not_found")
    status_code, result = progress.apply_event(student, device, body["event"], offline=True)
    return reply(status_code, result)


@hub_endpoint({"GET", "POST", "PUT", "DELETE"})
def not_found(request, device=None):
    return error(404, "not_found")
