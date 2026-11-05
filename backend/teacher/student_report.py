"""Teacher Reports, the student report: one student across the 6 zones, their levels, assessments, progress and activity.

Only a student of the class section(s) the teacher is assigned to can be opened. Where the LMS did not send a piece of
data (answers, unanswered questions, a score on a lesson) the field is null, so the page can say "not captured" instead
of showing a misleading zero.
"""
import re
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.names import title_name
from accounts.permissions import IsTeacher
from accounts.scoping import get_user_school
from assessments.models import ScreenResponse, StudentAttempt
from content_studio.models import Experience
from lms.packages.views import build_level_map, resolve_grade
from lmshub.models import LmsSession
from school_admin.models import Class
from .class_report import LESSONS_PER_ZONE, ZONES, _zone_of, performance_label, thresholds
from .models import Student
from .reports import _class_scope, _in_scope

HISTORY_DAYS = 60
SESSIONS_SHOWN = 30
PERIODS = (7, 30)


def _iso(value):
    return value.isoformat() if value else None


def _num(value):
    return float(value) if value is not None else None


def _round(value, digits=1):
    return round(value, digits) if value is not None else None


def _attempt_payload(a, screens):
    flagged = [r for r in screens if r.is_correct is not None]
    return {
        "id": a.id,
        "startedAt": _iso(a.started_at),
        "completedAt": _iso(a.completed_at),
        "status": a.status,
        "percentage": _num(a.percentage),
        "score": _num(a.total_score),
        "maxScore": _num(a.max_score),
        "seconds": a.time_spent_seconds,
        "stars": a.stars,
        "screens": len(screens),
        "correct": sum(1 for r in flagged if r.is_correct) if flagged else None,
        "incorrect": sum(1 for r in flagged if not r.is_correct) if flagged else None,
    }


def _first_completion(attempts):
    done = [a.completed_at or a.started_at for a in attempts if a.status == "COMPLETED"]
    return min(done) if done else None


def _level_state(attempts, payloads):
    """Status, scores and times of one level (a lesson) from the student's attempts at it, oldest first."""
    if not attempts:
        return {"status": "not_started", "attempts": 0, "score": None, "bestScore": None, "previousScore": None,
                "correct": None, "incorrect": None, "seconds": 0, "startedAt": None, "completedAt": None, "attemptList": []}
    scored = [p["percentage"] for p in payloads if p["percentage"] is not None]
    latest = payloads[-1]
    return {
        "status": "completed" if any(a.status == "COMPLETED" for a in attempts) else "in_progress",
        "attempts": len(attempts),
        "score": latest["percentage"],
        "bestScore": max(scored) if scored else None,
        "previousScore": payloads[-2]["percentage"] if len(payloads) > 1 else None,
        "correct": latest["correct"],
        "incorrect": latest["incorrect"],
        "seconds": sum(max(a.time_spent_seconds or 0, 0) for a in attempts),
        "startedAt": _iso(attempts[0].started_at),
        "completedAt": _iso(_first_completion(attempts)),
        "attemptList": payloads,
    }


def build_student_report(student, now):
    grade = resolve_grade(student)
    level_map = build_level_map(grade) if grade else {"lessons": [], "bosses": []}
    lesson_entries = {str(e["experienceId"]): e for e in level_map["lessons"] if e}
    boss_entries = {str(e["experienceId"]): e for e in level_map["bosses"] if e}
    mastery = {str(i): e.mastery_threshold for i, e in Experience.objects.in_bulk(
        [int(r) for r in boss_entries if r.isdigit()]).items()}

    attempts = list(StudentAttempt.objects.filter(student=student.user, school=student.school)
                    .select_related("assignment").order_by("started_at", "id"))
    screens_by_attempt = {}
    for r in ScreenResponse.objects.filter(attempt__in=attempts).order_by("id"):
        screens_by_attempt.setdefault(r.attempt_id, []).append(r)
    payload_of = {a.id: _attempt_payload(a, screens_by_attempt.get(a.id, [])) for a in attempts}

    by_lesson, by_boss, other_lessons = {}, {}, {}
    for a in attempts:
        ref, key = a.assignment.experience_ref, str(a.level_key or "").upper()
        if ref in boss_entries or key.startswith("B"):
            by_boss.setdefault(ref, []).append(a)
        elif ref in lesson_entries:
            by_lesson.setdefault(ref, []).append(a)
        else:
            other_lessons.setdefault(ref, []).append(a)

    # levels 1-30 with their zone, and the zones that group them
    levels, first_done = [], {}
    for slot in range(1, 31):
        entry = next((e for e in level_map["lessons"] if e and e["slot"] == slot), None)
        base = {"level": slot, "zone": _zone_of(slot), "levelInZone": (slot - 1) % LESSONS_PER_ZONE + 1}
        if entry is None:
            levels.append({**base, "title": None, "status": "not_published", "attempts": 0, "attemptList": []})
            continue
        ref = str(entry["experienceId"])
        mine = by_lesson.get(ref, [])
        first_done[slot] = _first_completion(mine)
        levels.append({**base, "title": entry["title"], "experienceId": entry["experienceId"],
                       **_level_state(mine, [payload_of[a.id] for a in mine])})

    assessments = []
    for ref, entry in sorted(boss_entries.items(), key=lambda kv: kv[1]["slot"]):
        mine = by_boss.get(ref, [])
        done = [a for a in mine if a.status == "COMPLETED"]
        latest = done[-1] if done else None
        shots = screens_by_attempt.get(latest.id, []) if latest else []
        flagged = [r for r in shots if r.is_correct is not None]
        scored = [_num(a.percentage) for a in done if a.percentage is not None]
        pass_mark = mastery.get(ref, 70)
        percentage = _num(latest.percentage) if latest else None
        assessments.append({
            "name": entry["title"], "zone": entry["slot"], "zoneName": ZONES[entry["slot"] - 1]["name"],
            "status": "completed" if done else ("in_progress" if mine else "not_started"),
            "attempts": len(mine),
            "totalQuestions": len(shots) if shots else None,
            "correct": sum(1 for r in flagged if r.is_correct) if flagged else None,
            "incorrect": sum(1 for r in flagged if not r.is_correct) if flagged else None,
            "unanswered": None,  # the LMS does not tell the CMS which questions were left unanswered
            "totalMarks": _num(latest.max_score) if latest else None,
            "marksObtained": _num(latest.total_score) if latest else None,
            "percentage": percentage,
            "passMark": pass_mark,
            "result": None if percentage is None else ("pass" if percentage >= pass_mark else "fail"),
            "highestScore": max(scored) if scored else None,
            "latestScore": percentage,
            "date": _iso(latest.completed_at or latest.started_at) if latest else None,
            "answers": [{
                "screen": r.screen_title or r.screen_ref, "type": r.screen_type, "isCorrect": r.is_correct,
                "score": _num(r.score), "maxScore": _num(r.max_score), "seconds": r.time_spent_seconds,
                "details": r.response_data if isinstance(r.response_data, dict) else {},
            } for r in shots],
        })

    zones = []
    for zone in ZONES:
        z = zone["id"]
        zone_levels = [l for l in levels if l["zone"] == z]
        published = [l for l in zone_levels if l["status"] != "not_published"]
        done_levels = [l for l in published if l["status"] == "completed"]
        zone_attempts = [a for l in published for a in by_lesson.get(str(l["experienceId"]), [])]
        boss = next((e for e in assessments if e["zone"] == z), None)
        zone_attempts += by_boss.get(next((r for r, e in boss_entries.items() if e["slot"] == z), None), [])
        complete = bool(published) and len(done_levels) == len(published)
        stamps = [l["completedAt"] for l in done_levels if l["completedAt"]]
        zones.append({
            "zone": z, "name": zone["name"],
            "progress": round(len(done_levels) / len(published) * 100) if published else None,
            "levelsCompleted": len(done_levels), "levelsTotal": LESSONS_PER_ZONE, "levelsPublished": len(published),
            "gamesPlayed": sum(1 for l in published if l["attempts"]), "gamesCompleted": len(done_levels),
            "assessmentScore": boss["latestScore"] if boss else None,
            "assessmentBest": boss["highestScore"] if boss else None,
            "attempts": len(zone_attempts),
            "seconds": sum(max(a.time_spent_seconds or 0, 0) for a in zone_attempts),
            "completedAt": max(stamps) if complete and stamps else None,
            "complete": complete,
        })

    # the overview
    published_total = sum(z["levelsPublished"] for z in zones)
    done_total = sum(z["levelsCompleted"] for z in zones)
    lesson_attempts = [a for group in list(by_lesson.values()) + list(other_lessons.values()) for a in group]
    boss_attempts = [a for group in by_boss.values() for a in group]
    completed_lessons = {a.assignment.experience_ref for a in lesson_attempts if a.status == "COMPLETED"}
    played_lessons = {a.assignment.experience_ref for a in lesson_attempts}
    all_scores = [_num(a.percentage) for a in boss_attempts if a.status == "COMPLETED" and a.percentage is not None]
    average = _round(sum(all_scores) / len(all_scores)) if all_scores else None
    seconds = sum(max(a.time_spent_seconds or 0, 0) for a in attempts)
    lesson_seconds = sum(max(a.time_spent_seconds or 0, 0) for a in lesson_attempts)
    sessions = list(LmsSession.objects.filter(student=student).order_by("-created_at"))
    last_activity = max([a.completed_at or a.started_at for a in attempts], default=None)
    seen = [s.last_heartbeat for s in sessions]
    last_active = max([x for x in [last_activity] + seen if x], default=None)
    inactive_after = timedelta(days=settings.REPORT_INACTIVE_AFTER_DAYS)
    overview = {
        "studentId": student.student_id, "loginCode": student.user.username,
        "name": title_name(student.user.full_name) or student.user.username,
        "rollNo": student.roll_no, "grade": student.grade, "section": student.section,
        "progress": round(done_total / published_total * 100) if published_total else None,
        "zonesCompleted": sum(1 for z in zones if z["complete"]), "zonesTotal": len(ZONES),
        "levelsCompleted": done_total, "levelsTotal": published_total,
        "avgAssessment": average,
        "gamesPlayed": len(played_lessons), "gamesCompleted": len(completed_lessons),
        "assessmentsCompleted": len({a.assignment.experience_ref for a in boss_attempts if a.status == "COMPLETED"}),
        "attempts": len(attempts), "learningSeconds": seconds,
        "avgSecondsPerGame": round(lesson_seconds / len(played_lessons)) if played_lessons else None,
        "lastLogin": _iso(sessions[0].created_at) if sessions else None,
        "lastActivity": _iso(last_activity), "lastActive": _iso(last_active),
        "performance": performance_label(average),
        "activity": "active" if last_active and now - last_active <= inactive_after else "inactive",
    }

    # progress and improvement
    timeline = [
        {"date": _iso(a.completed_at or a.started_at), "percentage": _num(a.percentage),
         "name": a.assignment.experience_title, "zone": int(m.group(1)) if (m := re.fullmatch(r"B([1-6])", str(a.level_key or "").upper())) else None}
        for a in sorted(boss_attempts, key=lambda a: a.completed_at or a.started_at)
        if a.status == "COMPLETED" and a.percentage is not None
    ]
    improvement = []
    for ref, mine in by_boss.items():
        scored = [a for a in mine if a.status == "COMPLETED" and a.percentage is not None]
        if len(scored) >= 2:
            first, latest = _num(scored[0].percentage), _num(scored[-1].percentage)
            improvement.append({"name": boss_entries.get(ref, {}).get("title") or scored[0].assignment.experience_title,
                                "firstScore": first, "latestScore": latest, "change": _round(latest - first)})
    periods = {}
    for days in PERIODS:
        cutoff = now - timedelta(days=days)
        recent = [a for a in attempts if (a.completed_at or a.started_at) >= cutoff]
        periods[str(days)] = {
            "levelsCompleted": sum(1 for dt in first_done.values() if dt and dt >= cutoff),
            "attempts": len(recent),
            "learningSeconds": sum(max(a.time_spent_seconds or 0, 0) for a in recent),
            "activeDays": len({(a.completed_at or a.started_at).date() for a in recent}
                              | {s.created_at.date() for s in sessions if s.created_at >= cutoff}),
        }

    # activity history: the last 60 days, one entry a day, plus the latest sessions
    cutoff = now - timedelta(days=HISTORY_DAYS)
    days = {}
    for a in attempts:
        when = a.completed_at or a.started_at
        if when < cutoff:
            continue
        kind = "assessment" if (a.assignment.experience_ref in boss_entries or str(a.level_key or "").upper().startswith("B")) else "lesson"
        day = days.setdefault(when.date().isoformat(), {"date": when.date().isoformat(), "seconds": 0, "items": [], "sessions": 0})
        day["seconds"] += max(a.time_spent_seconds or 0, 0)
        day["items"].append({"kind": kind, "title": a.assignment.experience_title, "at": _iso(when),
                             "status": a.status, "seconds": a.time_spent_seconds})
    for s in sessions:
        if s.created_at >= cutoff:
            day = days.setdefault(s.created_at.date().isoformat(),
                                  {"date": s.created_at.date().isoformat(), "seconds": 0, "items": [], "sessions": 0})
            day["sessions"] += 1
    history = sorted(days.values(), key=lambda d: d["date"], reverse=True)
    session_list = [{
        "loginAt": _iso(s.created_at), "lastSeenAt": _iso(s.ended_at or s.last_heartbeat), "endReason": s.end_reason,
        "seconds": max(int(((s.ended_at or s.last_heartbeat) - s.created_at).total_seconds()), 0),
    } for s in sessions[:SESSIONS_SHOWN]]

    return {
        "overview": overview, "zones": zones, "levels": levels, "assessments": assessments,
        "progress": {"timeline": timeline, "zoneComparison": [
            {"zone": z["zone"], "name": z["name"], "progress": z["progress"], "assessmentScore": z["assessmentScore"]} for z in zones],
            "periods": periods, "improvement": improvement},
        "history": history, "sessions": session_list,
        "thresholds": thresholds(), "inactiveAfterDays": settings.REPORT_INACTIVE_AFTER_DAYS,
    }


class TeacherStudentReportAPIView(APIView):
    """GET /api/cms/v1/teacher/reports/students/<student_id>/report/: the full report of one student of the teacher's own
    class section(s)."""
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request, student_id):
        school = get_user_school(request.user)
        scope = _class_scope(Class.objects.filter(teacherclass__teacher__user=request.user).select_related("grade"))
        student = Student.objects.filter(student_id=student_id, school=school, user__is_active=True) \
            .select_related("user", "school").first() if school else None
        if not student or not _in_scope(student, scope):
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(build_student_report(student, timezone.now()))
