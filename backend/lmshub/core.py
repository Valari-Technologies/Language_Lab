"""Shared helpers for the CMS LMS hub: JSON replies, device/session auth, throttling, licence and seats."""
import hashlib
import ipaddress
import json
import math
import re
import secrets
from datetime import timedelta

from django.core.exceptions import RequestDataTooBig
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone

from django.db import IntegrityError

from super_admin.models import License
from .models import LmsDevice, LmsPairingCode, LmsSession, LmsThrottle

PAIRING_CODE_LIFETIME = timedelta(minutes=10)


def current_pairing_code(school):
    """The school's 6-digit pairing code; a new one when there is none or it has expired."""
    now = timezone.now()
    for _ in range(2):
        try:
            with transaction.atomic():
                row = LmsPairingCode.objects.select_for_update().filter(school=school).first()
                if row is None:
                    row = LmsPairingCode.objects.create(
                        school=school, code=f"{secrets.randbelow(1_000_000):06d}", expires_at=now + PAIRING_CODE_LIFETIME
                    )
                elif row.expires_at <= now:
                    row.code = f"{secrets.randbelow(1_000_000):06d}"
                    row.expires_at = now + PAIRING_CODE_LIFETIME
                    row.save(update_fields=["code", "expires_at"])
                return row
        except IntegrityError:  # another request created it at the same moment
            continue
    return LmsPairingCode.objects.get(school=school)


def hub_name(school):
    return f"{school.school_name} (CMS)"

HEARTBEAT_WINDOW = timedelta(seconds=120)
MAX_BODY_BYTES = 1024 * 1024
TOKEN_RE = re.compile(r"^[0-9a-f]{64}$")
PC_ID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)
LAST_SEEN_EVERY = timedelta(seconds=60)


def sha256_hex(text):
    return hashlib.sha256(str(text).encode("utf-8")).hexdigest()


def new_token():
    return secrets.token_hex(32)


def iso(dt):
    return dt.isoformat() if dt else None


def reply(status, body):
    response = JsonResponse(body, status=status, json_dumps_params={"ensure_ascii": False})
    response["Cache-Control"] = "no-store"
    response["X-Content-Type-Options"] = "nosniff"
    return response


def error(status, code, **extra):
    return reply(status, {"ok": False, "error": code, **extra})


class BodyError(Exception):
    def __init__(self, status, code):
        super().__init__(code)
        self.status = status
        self.code = code


def read_json(request):
    """The request's JSON object (empty body -> {}); JSON only, at most 1 MB."""
    if not request.META.get("CONTENT_TYPE", "").lower().startswith("application/json"):
        raise BodyError(415, "json_required")
    try:
        length = int(request.META.get("CONTENT_LENGTH") or 0)
    except ValueError:
        length = 0
    if length > MAX_BODY_BYTES:
        raise BodyError(413, "body_too_large")
    try:
        raw = request.body
    except RequestDataTooBig:
        raise BodyError(413, "body_too_large")
    if len(raw) > MAX_BODY_BYTES:
        raise BodyError(413, "body_too_large")
    if not raw:
        return {}
    try:
        return json.loads(raw.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        raise BodyError(400, "invalid_json")


def client_ip(request):
    raw = request.META.get("HTTP_X_REAL_IP") or request.META.get("REMOTE_ADDR") or ""
    try:
        return str(ipaddress.ip_address(raw.strip()))
    except ValueError:
        return None


def device_for_token(token):
    """Paired PC for an X-Hub-Token (removed ones included, so they get "revoked"), or None."""
    token = str(token or "")
    if not TOKEN_RE.match(token):
        return None
    return LmsDevice.objects.select_related("school").filter(token_hash=sha256_hex(token)).first()


def touch_device(device, ip):
    now = timezone.now()
    if device.last_seen and now - device.last_seen < LAST_SEEN_EVERY and device.last_ip == ip:
        return
    LmsDevice.objects.filter(pk=device.pk).update(last_seen=now, last_ip=ip)
    device.last_seen, device.last_ip = now, ip


# ---------------------------------------------------------------- throttling (database, all workers)

def throttle_wait(key):
    """Seconds left of a lock on `key`, or 0."""
    row = LmsThrottle.objects.filter(key=key).first()
    now = timezone.now()
    if row and row.locked_until and row.locked_until > now:
        return math.ceil((row.locked_until - now).total_seconds())
    return 0


def throttle_fail(key, max_failures, lock_seconds):
    """Count a failure; at max_failures the key is locked. Returns (locked, retry_after_sec, remaining)."""
    now = timezone.now()
    with transaction.atomic():
        row, _ = LmsThrottle.objects.select_for_update().get_or_create(
            key=key, defaults={"count": 0, "window_start": now}
        )
        if row.locked_until and row.locked_until <= now:
            row.count, row.locked_until = 0, None
        row.count += 1
        if row.count >= max_failures:
            row.count, row.locked_until = 0, now + timedelta(seconds=lock_seconds)
            row.save()
            return True, lock_seconds, 0
        row.save()
        return False, 0, max_failures - row.count


def throttle_clear(key):
    LmsThrottle.objects.filter(key=key).delete()


def rate_limit(key, limit, window_seconds):
    """At most `limit` calls per window. Returns seconds to wait, or 0 (call counted)."""
    now = timezone.now()
    with transaction.atomic():
        row, _ = LmsThrottle.objects.select_for_update().get_or_create(
            key=key, defaults={"count": 0, "window_start": now}
        )
        if now - row.window_start >= timedelta(seconds=window_seconds):
            row.count, row.window_start = 0, now
        if row.count >= limit:
            return max(1, math.ceil((row.window_start + timedelta(seconds=window_seconds) - now).total_seconds()))
        row.count += 1
        row.save()
        return 0


# ---------------------------------------------------------------- licence, seats, sessions

def license_state(school):
    lic = License.objects.filter(school=school).first()
    if not lic:
        return {"license": None, "active": False, "expired": False}
    expired = lic.status == License.Status.EXPIRED or bool(lic.expiryDate and lic.expiryDate < timezone.now().date())
    active = lic.status == License.Status.ACTIVE and not expired and school.is_active
    return {"license": lic, "active": active, "expired": expired}


def seat_total(state):
    lic = state["license"]
    total = lic.concurrentUsersPerServer if lic else None
    return total if total and total > 0 else None


def expire_stale():
    """Open sessions without a heartbeat for 120 s are closed as expired."""
    now = timezone.now()
    LmsSession.objects.filter(ended_at__isnull=True, last_heartbeat__lt=now - HEARTBEAT_WINDOW).update(
        ended_at=now, end_reason="expired"
    )


def open_sessions(school):
    return LmsSession.objects.filter(ended_at__isnull=True, device__school=school)


def seats_used(school):
    expire_stale()
    return open_sessions(school).count()


def session_for(device, token):
    """(session, None) for an X-Session-Token of this PC, or (None, error)."""
    token = str(token or "")
    if not TOKEN_RE.match(token):
        return None, "session_expired"
    session = (
        LmsSession.objects.select_related("student", "student__user", "student__school")
        .filter(token_hash=sha256_hex(token))
        .first()
    )
    if not session:
        return None, "session_expired"
    if session.device_id != device.id:
        return None, "session_wrong_pc"
    return session, None


def active_session(device, token):
    """Open, fresh session of this PC, or (None, error) as the hub answers it."""
    session, err = session_for(device, token)
    if err:
        return None, err
    if session.ended_at is None and session.last_heartbeat < timezone.now() - HEARTBEAT_WINDOW:
        expire_stale()
        return None, "session_expired"
    if session.ended_at:
        return None, "session_replaced" if session.end_reason == "replaced" else "session_expired"
    return session, None


def end_sessions_for_device(device, reason):
    LmsSession.objects.filter(ended_at__isnull=True, device=device).update(ended_at=timezone.now(), end_reason=reason)


def student_payload_grade(student):
    grade = (str(student.grade).strip() if student.grade is not None else "") or None
    digits = re.sub(r"[^0-9]", "", grade or "")
    return grade, (int(digits) if digits else None)
