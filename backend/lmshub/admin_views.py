"""CMS page "LMS Hub": pairing code, paired computers, seats, active students, plans and progress problems."""
import hmac

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.scoping import get_user_school
from super_admin.models import School
from . import plans
from .core import (
    current_pairing_code, end_sessions_for_device, iso, license_state, open_sessions, seat_total, seats_used, sha256_hex,
)
from .models import LmsDevice, LmsHubAccess, LmsProgressEvent


def _normalize_key(key):
    return str(key or "").strip().upper()


def is_unlocked(school):
    """The LMS Hub page was opened once with the school's current licence key."""
    access = LmsHubAccess.objects.filter(school=school).first()
    lic = license_state(school)["license"]
    if not access or not lic or not lic.licenseKey:
        return False
    return hmac.compare_digest(access.license_key_hash, sha256_hex(_normalize_key(lic.licenseKey)))


def _key_required_response():
    return Response(
        {"error": "lms_key_required", "message": "Enter the school's LMS licence key to open the LMS Hub."},
        status=status.HTTP_403_FORBIDDEN,
    )


def _is_super_admin(user):
    return user.role == "SUPER_ADMIN" or user.is_superuser


def _school_for(request):
    """(school, None) for the caller, or (None, Response). School admins: own school; super admin: ?school_id=."""
    user = request.user
    if user.role == "SUPER_ADMIN" or user.is_superuser:
        raw = str(request.query_params.get("school_id") or request.data.get("school_id") or "")
        if not raw.isdigit():
            return None, Response({"error": "school_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        school = School.objects.filter(school_id=int(raw)).first()
        if not school:
            return None, Response({"error": "School not found."}, status=status.HTTP_404_NOT_FOUND)
        return school, None
    if user.role == "SCHOOL_ADMIN":
        school = get_user_school(user)
        if school:
            return school, None
    return None, Response({"error": "Only school admins and the super admin can open the LMS hub."},
                          status=status.HTTP_403_FORBIDDEN)


def _student_name(student):
    return student.user.full_name or student.user.username


class LmsHubOverviewAPIView(APIView):
    """GET /api/cms/v1/lms-hub/overview/ (super admin: ?school_id=)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        school, failure = _school_for(request)
        if failure:
            return failure
        if not _is_super_admin(request.user) and not is_unlocked(school):
            return _key_required_response()
        now = timezone.now()
        code = current_pairing_code(school)
        state = license_state(school)

        sessions = list(open_sessions(school).select_related("student__user", "device").order_by("created_at"))
        busy_devices = {s.device_id for s in sessions}
        devices = [
            {
                "id": d.id,
                "pcId": str(d.pc_id),
                "pcName": d.pc_name,
                "lastIp": d.last_ip,
                "lastSeen": iso(d.last_seen),
                "pairedAt": iso(d.paired_at),
                "revoked": d.revoked,
                "inUse": d.id in busy_devices,
            }
            for d in LmsDevice.objects.filter(school=school).order_by("revoked", "pc_name")
        ]

        grade_plans = []
        for grade in sorted(plans.school_grades(school).values(), key=lambda g: (g.sort_order, g.id)):
            plan = plans.plan_for_grade(grade)
            grade_plans.append({
                "grade": plan["grade"],
                "counts": plan["counts"],
                "lessons": [{"slot": e["slot"], "title": e["title"], "available": e["available"]} if e else None
                            for e in plan["lessons"]],
                "bosses": [{"slot": e["slot"], "title": e["title"], "available": e["available"]} if e else None
                           for e in plan["bosses"]],
            })

        events = LmsProgressEvent.objects.filter(student__school=school)
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        rejected = [
            {
                "eventId": str(e.event_id),
                "student": _student_name(e.student),
                "loginCode": e.student.user.username,
                "levelKey": (e.payload or {}).get("level_key"),
                "error": e.attempt_error,
                "receivedAt": iso(e.received_at),
            }
            for e in events.filter(attempt_status="rejected").select_related("student__user").order_by("-received_at")[:50]
        ]
        no_class = {}
        for e in events.filter(attempt_status="no_class").select_related("student__user").order_by("-received_at")[:500]:
            s = e.student
            no_class.setdefault(s.student_id, {
                "student": _student_name(s), "loginCode": s.user.username, "grade": s.grade, "section": s.section,
            })

        return Response({
            "school": {"id": school.school_id, "schoolId": school.schoolId, "name": school.school_name,
                       "schoolCode": school.school_code},
            "pairing": {"code": code.code, "expiresAt": iso(code.expires_at),
                        "secondsLeft": max(0, int((code.expires_at - now).total_seconds()))},
            "cmsAddress": request.build_absolute_uri("/").rstrip("/"),
            "licenseActive": state["active"],
            "seats": {"used": seats_used(school), "total": seat_total(state)},
            "devices": devices,
            "sessions": [
                {"student": _student_name(s.student), "loginCode": s.student.user.username,
                 "computer": s.device.pc_name, "deviceId": s.device.id, "since": iso(s.created_at)}
                for s in sessions
            ],
            "plans": grade_plans,
            "progress": {
                "attemptsToday": events.filter(received_at__gte=start_of_day).exclude(type="state").count(),
                "rejected": rejected,
                "noClass": list(no_class.values()),
            },
        })


class LmsHubRemoveDeviceAPIView(APIView):
    """POST /api/cms/v1/lms-hub/devices/<id>/remove/: the PC can no longer use the hub; its student is logged out."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        if user.role == "SUPER_ADMIN" or user.is_superuser:
            device = LmsDevice.objects.filter(pk=pk).first()
        elif user.role == "SCHOOL_ADMIN" and get_user_school(user):
            device = LmsDevice.objects.filter(pk=pk, school=get_user_school(user)).first()
        else:
            return Response({"error": "Only school admins and the super admin can remove computers."},
                            status=status.HTTP_403_FORBIDDEN)
        if not device:
            return Response({"error": "Computer not found."}, status=status.HTTP_404_NOT_FOUND)
        if not _is_super_admin(user) and not is_unlocked(device.school):
            return _key_required_response()
        LmsDevice.objects.filter(pk=device.pk).update(revoked=True)
        end_sessions_for_device(device, "pc_removed")
        return Response({"ok": True, "message": f"Computer '{device.pc_name}' was removed."})


class LmsHubUnlockAPIView(APIView):
    """
    POST /api/cms/v1/lms-hub/unlock/ {"key": "<school licence key>"}: opens the LMS Hub page for the school
    (once per school; a new licence key locks it again). School admins only, for their own school.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "SCHOOL_ADMIN":
            return Response({"error": "Only school admins unlock the LMS Hub."}, status=status.HTTP_403_FORBIDDEN)
        school, failure = _school_for(request)
        if failure:
            return failure
        lic = license_state(school)["license"]
        typed = _normalize_key(request.data.get("key") if isinstance(request.data, dict) else "")
        if not typed:
            return Response({"error": "key_required", "message": "Enter the LMS licence key."},
                            status=status.HTTP_400_BAD_REQUEST)
        expected = _normalize_key(lic.licenseKey) if lic and lic.licenseKey else ""
        if not expected or not hmac.compare_digest(typed.encode(), expected.encode()):
            return Response({"error": "wrong_key", "message": "This is not the LMS licence key of your school."},
                            status=status.HTTP_400_BAD_REQUEST)
        LmsHubAccess.objects.update_or_create(
            school=school,
            defaults={"license_key_hash": sha256_hex(expected), "unlocked_at": timezone.now(),
                      "unlocked_by": request.user},
        )
        return Response({"ok": True, "message": "The LMS Hub is unlocked for your school."})
