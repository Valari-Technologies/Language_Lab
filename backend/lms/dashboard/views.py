import logging
from django.db.models import Avg, Count, Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from teacher.models import Student
from school_admin.models import Class
from assessments.models import StudentAttempt, ExperienceAssignment
from content_studio.models import PublishedPackage

logger = logging.getLogger(__name__)


def _get_student(user):
    try:
        return Student.objects.select_related("user", "school").get(user=user)
    except Student.DoesNotExist:
        return None


class LMSDashboardAggregatorAPIView(APIView):
    """
    LMS Student Dashboard Aggregator API endpoint.
    `GET /api/lms/dashboard/`
    Returns computed student identity, grade coordinates, section strings, assigned package counts,
    latest lesson session markers (last_lesson, resume_lesson), and progress summary.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        student = _get_student(request.user)
        if not student:
            return Response(
                {"error": "Active student profile required."},
                status=status.HTTP_403_FORBIDDEN
            )

        school = student.school
        class_obj = Class.objects.select_related("grade").filter(school=school, is_active=True).first()
        grade = class_obj.grade if class_obj else None

        # 1. Assigned Packages Count
        assigned_exp_refs = set(
            ExperienceAssignment.objects.filter(school=school)
            .filter(Q(grade=grade) | Q(class_obj=class_obj) | Q(grade__isnull=True, class_obj__isnull=True))
            .values_list("experience_ref", flat=True)
        )

        q_filter = Q(experience__grade=grade) | Q(experience__id__in=[
            int(r) for r in assigned_exp_refs if str(r).isdigit()
        ]) | Q(experience__title__in=assigned_exp_refs)

        assigned_packages_count = PublishedPackage.objects.filter(
            compression_status="COMPLETED"
        ).filter(q_filter).count()

        # 2. Student Attempt Metrics
        user_attempts = StudentAttempt.objects.filter(student=request.user, school=school).select_related("assignment")
        total_attempts = user_attempts.count()
        completed_count = user_attempts.filter(status="COMPLETED").count()

        avg_score = user_attempts.filter(status="COMPLETED", percentage__isnull=False).aggregate(avg_pct=Avg("percentage"))["avg_pct"]
        average_percentage = round(float(avg_score), 2) if avg_score is not None else 0.0

        if assigned_packages_count > 0:
            completion_rate = round(min(100.0, (completed_count / assigned_packages_count) * 100.0), 2)
        elif total_attempts > 0:
            completion_rate = round((completed_count / total_attempts) * 100.0, 2)
        else:
            completion_rate = 0.0

        # 3. Last & Resume Lesson Markers
        last_attempt = user_attempts.order_by("-synced_at", "-started_at").first()
        last_lesson = None
        resume_lesson = None

        if last_attempt:
            last_lesson = {
                "experience_title": last_attempt.assignment.experience_title if last_attempt.assignment else "Lesson",
                "status": last_attempt.status,
                "updated_at": last_attempt.synced_at.isoformat() if last_attempt.synced_at else None
            }
            resume_lesson = {
                "attempt_id": last_attempt.lms_attempt_id,
                "experience_ref": last_attempt.assignment.experience_ref if last_attempt.assignment else None,
                "experience_title": last_attempt.assignment.experience_title if last_attempt.assignment else "Lesson",
                "status": last_attempt.status
            }

        grade_name = grade.grade_name if grade else None
        class_name = class_obj.class_name if class_obj else None

        payload = {
            "student": {
                "id": student.student_id,
                "user_id": request.user.id,
                "roll_number": request.user.username,
                "full_name": request.user.full_name or request.user.username,
                "email": request.user.email or "",
                "school": school.school_name,
                "grade": grade_name,
                "class_section": class_name
            },
            "assigned_packages_count": assigned_packages_count,
            "last_lesson": last_lesson,
            "resume_lesson": resume_lesson,
            "progress_summary": {
                "total_attempts": total_attempts,
                "completed_count": completed_count,
                "average_percentage": average_percentage,
                "completion_rate": completion_rate
            }
        }

        return Response(payload, status=status.HTTP_200_OK)
