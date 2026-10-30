"""Teacher portal "Reports": results of the students of the grade(s) the teacher teaches."""
from datetime import timedelta

from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsTeacher
from accounts.scoping import get_user_school
from assessments.models import StudentAttempt
from lmshub.models import LmsSession
from lms.packages.views import _grade_number
from school_admin.models import Class
from .models import Student


def _grade_key(label):
    """"Class 3", "Grade 3" and "3" are the same grade; labels without a number compare as text."""
    number = _grade_number(label)
    return number if number is not None else str(label or "").strip().lower()


def _average(values):
    return round(sum(values) / len(values), 1) if values else None


class TeacherReportsAPIView(APIView):
    """GET /api/cms/v1/teacher/reports/?grade_id=<id>: only students of the teacher's own grade(s), own school."""
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request):
        school = get_user_school(request.user)
        classes = Class.objects.filter(teacherclass__teacher__user=request.user).select_related("grade")
        grades = {c.grade_id: c.grade for c in classes if c.grade_id}
        grade_list = [{"id": g.id, "name": g.grade_name} for g in sorted(grades.values(), key=lambda g: (g.sort_order, g.id))]
        empty = {"grades": grade_list, "gradeId": None,
                 "summary": {"students": 0, "attempts": 0, "averagePercent": None, "completedLessons": 0},
                 "students": []}
        if not school or not grades:
            return Response(empty)

        raw = str(request.query_params.get("grade_id") or "")
        selected = list(grades.values())
        if raw:
            if not raw.isdigit() or int(raw) not in grades:
                return Response({"error": "This grade is not assigned to you."}, status=status.HTTP_400_BAD_REQUEST)
            selected = [grades[int(raw)]]
        keys = {_grade_key(g.grade_name) for g in selected}

        students = [
            s for s in Student.objects.filter(school=school, user__is_active=True).select_related("user")
            if _grade_key(s.grade) in keys
        ]
        attempts_by_user = {}
        for attempt in (
            StudentAttempt.objects.filter(school=school, student__in=[s.user_id for s in students])
            .select_related("assignment")
        ):
            attempts_by_user.setdefault(attempt.student_id, []).append(attempt)

        rows = []
        all_percentages = []
        total_attempts = 0
        total_lessons = 0
        for student in students:
            attempts = attempts_by_user.get(student.user_id, [])
            completed = [a for a in attempts if a.status == "COMPLETED"]
            percentages = [float(a.percentage) for a in completed if a.percentage is not None]
            best_stars = {}
            for a in attempts:
                if a.level_key and a.stars is not None:
                    best_stars[a.level_key] = max(best_stars.get(a.level_key, 0), a.stars)
            last = max((a.completed_at or a.started_at for a in attempts), default=None)
            lessons = len({a.assignment.experience_ref for a in completed})
            rows.append({
                "id": student.student_id,
                "name": student.user.full_name or student.user.username,
                "loginCode": student.user.username,
                "rollNo": student.roll_no,
                "grade": student.grade,
                "section": student.section,
                "attempts": len(attempts),
                "completedLessons": lessons,
                "averagePercent": _average(percentages),
                "stars": sum(best_stars.values()),
                "lastActivity": last.isoformat() if last else None,
            })
            all_percentages += percentages
            total_attempts += len(attempts)
            total_lessons += lessons

        rows.sort(key=lambda r: (r["name"] or "").lower())
        return Response({
            "grades": grade_list,
            "gradeId": selected[0].id if raw else None,
            "summary": {"students": len(rows), "attempts": total_attempts,
                        "averagePercent": _average(all_percentages), "completedLessons": total_lessons},
            "students": rows,
        })


MAX_WINDOW = timedelta(hours=48)
ACTIVE_HEARTBEAT = timedelta(seconds=120)


def _window(request):
    """The day to report, as two instants chosen by the browser (its own local midnight to midnight)."""
    start = parse_datetime(str(request.query_params.get("start") or ""))
    end = parse_datetime(str(request.query_params.get("end") or ""))
    if not start or not end or timezone.is_naive(start) or timezone.is_naive(end) or not start < end <= start + MAX_WINDOW:
        return None, None
    return start, end


class TeacherStudentDayReportAPIView(APIView):
    """GET /api/cms/v1/teacher/reports/students/<student_id>/day/?start=<iso>&end=<iso>: one student, one day.

    Completed lessons and the time they took (the LMS-reported time per attempt), plus login and logout from the
    student's LMS sessions. Only for students of the teacher's own grade(s), own school.
    """
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request, student_id):
        start, end = _window(request)
        if not start:
            return Response({"error": "Give a valid start and end for the day."}, status=status.HTTP_400_BAD_REQUEST)
        school = get_user_school(request.user)
        keys = {
            _grade_key(c.grade.grade_name)
            for c in Class.objects.filter(teacherclass__teacher__user=request.user).select_related("grade") if c.grade_id
        }
        student = Student.objects.filter(student_id=student_id, school=school).select_related("user").first() if school else None
        if not student or _grade_key(student.grade) not in keys:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        lessons, lesson_seconds = set(), 0
        for a in StudentAttempt.objects.filter(student=student.user, school=school, status="COMPLETED").select_related("assignment"):
            finished = a.completed_at or a.started_at
            if not start <= finished < end:
                continue
            lessons.add(a.assignment.experience_ref)
            if a.time_spent_seconds is not None:
                lesson_seconds += max(a.time_spent_seconds, 0)
            elif a.completed_at:
                lesson_seconds += max(int((a.completed_at - a.started_at).total_seconds()), 0)

        now = timezone.now()
        spans = []
        for s in LmsSession.objects.filter(student=student, created_at__lt=end).order_by("created_at"):
            active = s.ended_at is None and now - s.last_heartbeat <= ACTIVE_HEARTBEAT
            stop = now if active else (s.ended_at or s.last_heartbeat)
            if stop >= start:
                spans.append((s, stop, active))
        online = sum(max(int((min(stop, end) - max(s.created_at, start)).total_seconds()), 0) for s, stop, _ in spans)
        last = spans[-1] if spans else None
        return Response({
            "studentId": student.student_id,
            "name": student.user.full_name or student.user.username,
            "completedLessons": len(lessons),
            "lessonSeconds": lesson_seconds,
            "loginAt": spans[0][0].created_at.isoformat() if spans else None,
            "logoutAt": last[1].isoformat() if last and not last[2] else None,
            "stillOnline": bool(last and last[2]),
            "onlineSeconds": online,
            "sessions": len(spans),
        })
