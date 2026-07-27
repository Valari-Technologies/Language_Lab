import logging
from datetime import datetime
from django.db import transaction
from django.db.models import Q
from django.utils.dateparse import parse_datetime
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from teacher.models import Student
from assessments.models import ExperienceAssignment, StudentAttempt, ScreenResponse
from super_admin.models import School, Grade
from lms.models import SyncLog, StudentProgress, QuizAttempt, ActivityReport
from content_studio.models import PublishedPackage, PublishVersion
from .serializers import (
    AttemptSyncItemSerializer,
    ProgressSyncItemSerializer,
    CompletionSyncItemSerializer,
)

logger = logging.getLogger(__name__)


def _get_student(user):
    try:
        return Student.objects.select_related("user", "school").get(user=user)
    except Student.DoesNotExist:
        return None


def _normalize_input_list(data):
    if isinstance(data, list):
        return data
    elif isinstance(data, dict):
        if "items" in data and isinstance(data["items"], list):
            return data["items"]
        if "attempts" in data and isinstance(data["attempts"], list):
            return data["attempts"]
        if "progress" in data and isinstance(data["progress"], list):
            return data["progress"]
        if "completions" in data and isinstance(data["completions"], list):
            return data["completions"]
        return [data]
    return []


class LMSSyncAttemptAPIView(APIView):
    """
    Transactional Attempt Log Ingestion Sync API.
    `POST /api/lms/sync/attempt/`
    Ingests scenario attempt log batches wrapped in row-level transaction.atomic() savepoints.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        student = _get_student(request.user)
        if not student:
            return Response(
                {"error": "Active student profile required."},
                status=status.HTTP_403_FORBIDDEN
            )

        items = _normalize_input_list(request.data)
        processed = 0
        failed = 0
        errors = []

        for index, item in enumerate(items):
            try:
                with transaction.atomic():
                    serializer = AttemptSyncItemSerializer(data=item)
                    if not serializer.is_valid():
                        failed += 1
                        errors.append({"row": index, "errors": serializer.errors})
                        continue

                    val = serializer.validated_data
                    lms_attempt_id = val["lms_attempt_id"]
                    exp_ref = val.get("experience_ref") or val.get("experience_id") or "1"
                    exp_title = val.get("experience_title") or "Lesson"
                    started_at = val["started_at"]

                    # Find or create ExperienceAssignment
                    assignment, _ = ExperienceAssignment.objects.get_or_create(
                        school=student.school,
                        experience_ref=str(exp_ref),
                        defaults={
                            "experience_title": exp_title,
                            "assigned_at": started_at,
                        }
                    )

                    StudentAttempt.objects.update_or_create(
                        lms_attempt_id=lms_attempt_id,
                        defaults={
                            "assignment": assignment,
                            "student": request.user,
                            "school": student.school,
                            "started_at": started_at,
                            "completed_at": val.get("completed_at"),
                            "status": val.get("status", "STARTED"),
                            "total_score": val.get("total_score"),
                            "max_score": val.get("max_score"),
                            "percentage": val.get("percentage"),
                            "time_spent_seconds": val.get("time_spent_seconds"),
                        }
                    )
                    processed += 1
            except Exception as exc:
                failed += 1
                errors.append({"row": index, "errors": str(exc)})

        return Response({
            "processed": processed,
            "failed": failed,
            "errors": errors
        }, status=status.HTTP_200_OK)


class LMSSyncProgressAPIView(APIView):
    """
    Transactional Intermediate Runtime Event & Screen State Ingestion API.
    `POST /api/lms/sync/progress/`
    Ingests screen response/event progress tracking data wrapped in row-level transaction.atomic() savepoints.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        student = _get_student(request.user)
        if not student:
            return Response(
                {"error": "Active student profile required."},
                status=status.HTTP_403_FORBIDDEN
            )

        items = _normalize_input_list(request.data)
        processed = 0
        failed = 0
        errors = []

        for index, item in enumerate(items):
            try:
                with transaction.atomic():
                    serializer = ProgressSyncItemSerializer(data=item)
                    if not serializer.is_valid():
                        failed += 1
                        errors.append({"row": index, "errors": serializer.errors})
                        continue

                    val = serializer.validated_data
                    lms_attempt_id = val["lms_attempt_id"]

                    try:
                        attempt = StudentAttempt.objects.get(lms_attempt_id=lms_attempt_id, school=student.school)
                    except StudentAttempt.DoesNotExist:
                        failed += 1
                        errors.append({"row": index, "errors": f"Attempt '{lms_attempt_id}' not found."})
                        continue

                    ScreenResponse.objects.update_or_create(
                        attempt=attempt,
                        screen_ref=val["screen_ref"],
                        defaults={
                            "school": student.school,
                            "screen_title": val.get("screen_title", ""),
                            "screen_type": val.get("screen_type", "INFORMATION"),
                            "response_data": val.get("response_data", {}),
                            "score": val.get("score"),
                            "max_score": val.get("max_score"),
                            "is_correct": val.get("is_correct"),
                            "time_spent_seconds": val.get("time_spent_seconds"),
                        }
                    )
                    processed += 1
            except Exception as exc:
                failed += 1
                errors.append({"row": index, "errors": str(exc)})

        return Response({
            "processed": processed,
            "failed": failed,
            "errors": errors
        }, status=status.HTTP_200_OK)


class LMSSyncCompletionAPIView(APIView):
    """
    Transactional Lesson Completion State Sync Ingestion API.
    `POST /api/lms/sync/completion/`
    Logs completion metrics when lesson benchmarks are satisfied.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        student = _get_student(request.user)
        if not student:
            return Response(
                {"error": "Active student profile required."},
                status=status.HTTP_403_FORBIDDEN
            )

        items = _normalize_input_list(request.data)
        processed = 0
        failed = 0
        errors = []

        for index, item in enumerate(items):
            try:
                with transaction.atomic():
                    serializer = CompletionSyncItemSerializer(data=item)
                    if not serializer.is_valid():
                        failed += 1
                        errors.append({"row": index, "errors": serializer.errors})
                        continue

                    val = serializer.validated_data
                    lms_attempt_id = val["lms_attempt_id"]

                    try:
                        attempt = StudentAttempt.objects.get(lms_attempt_id=lms_attempt_id, school=student.school)
                    except StudentAttempt.DoesNotExist:
                        failed += 1
                        errors.append({"row": index, "errors": f"Attempt '{lms_attempt_id}' not found."})
                        continue

                    attempt.status = "COMPLETED"
                    if val.get("completed_at"):
                        attempt.completed_at = val["completed_at"]
                    if val.get("total_score") is not None:
                        attempt.total_score = val["total_score"]
                    if val.get("max_score") is not None:
                        attempt.max_score = val["max_score"]
                    if val.get("percentage") is not None:
                        attempt.percentage = val["percentage"]
                    attempt.save()

                    processed += 1
            except Exception as exc:
                failed += 1
                errors.append({"row": index, "errors": str(exc)})

        return Response({
            "processed": processed,
            "failed": failed,
            "errors": errors
        }, status=status.HTTP_200_OK)


class LMSIngestReportsAPIView(APIView):
    """
    Ingest batched offline telemetry payloads.
    `POST /api/v1/lms/sync/ingest-reports/`
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        device_id = request.data.get("deviceId")
        student_roll_number = request.data.get("studentRollNumber")
        synced_at_str = request.data.get("syncedAt")
        reports = request.data.get("reports", [])

        if not student_roll_number:
            return Response(
                {"error": "studentRollNumber is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Resolve student
        student = Student.objects.filter(roll_no=student_roll_number).first()
        if not student:
            return Response(
                {"error": f"Student with roll number '{student_roll_number}' not found."},
                status=status.HTTP_400_BAD_REQUEST
            )

        synced_at = parse_datetime(synced_at_str) if synced_at_str else None
        processed_keys = []

        with transaction.atomic():
            for report in reports:
                idempotency_key = report.get("idempotencyKey")
                if not idempotency_key:
                    continue

                # Check Idempotency Logic
                if SyncLog.objects.filter(idempotency_key=idempotency_key).exists():
                    processed_keys.append(idempotency_key)
                    continue

                # Save SyncLog
                SyncLog.objects.create(
                    idempotency_key=idempotency_key,
                    device_id=device_id,
                    student_roll_no=student_roll_number,
                    synced_at=synced_at
                )

                scenario_id = report.get("scenarioId")
                activity_id = report.get("activityId")
                screen_id = report.get("screenId")
                score = report.get("score", 0)
                max_score = report.get("maxScore", 0)
                time_spent_seconds = report.get("timeSpentSeconds", 0)
                completed = report.get("completed", False)
                answers = report.get("answers", {})
                timestamp_str = report.get("timestamp")
                timestamp = parse_datetime(timestamp_str) if timestamp_str else datetime.now()

                # Upsert StudentProgress
                progress_obj, created = StudentProgress.objects.get_or_create(
                    student=student,
                    scenario_id=str(scenario_id),
                    defaults={"completed": completed, "total_time_spent": time_spent_seconds}
                )
                if not created:
                    progress_obj.total_time_spent += time_spent_seconds
                    if completed:
                        progress_obj.completed = True
                    progress_obj.save()

                # Save QuizAttempt if screen_id is present
                if screen_id:
                    QuizAttempt.objects.create(
                        student=student,
                        scenario_id=str(scenario_id),
                        activity_id=str(activity_id),
                        screen_id=str(screen_id),
                        score=score,
                        max_score=max_score,
                        answers=answers,
                        timestamp=timestamp
                    )

                # Save ActivityReport if activity_id is present
                if activity_id:
                    ActivityReport.objects.create(
                        student=student,
                        scenario_id=str(scenario_id),
                        activity_id=str(activity_id),
                        time_spent_seconds=time_spent_seconds,
                        completed=completed,
                        timestamp=timestamp
                    )

                processed_keys.append(idempotency_key)

        return Response({"processedKeys": processed_keys}, status=status.HTTP_200_OK)


class LMSPullUpdatesAPIView(APIView):
    """
    Outbound Data & Config Endpoint.
    `GET /api/v1/lms/sync/pull-updates/`
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        student_id = request.query_params.get("student_id")
        school_id = request.query_params.get("school_id")
        last_synced_at_str = request.query_params.get("last_synced_at")

        last_synced_at = None
        if last_synced_at_str:
            last_synced_at = parse_datetime(last_synced_at_str)

        school = None
        if school_id:
            school = School.objects.filter(school_id=school_id).first()
        elif student_id:
            student = Student.objects.filter(student_id=student_id).first()
            if student:
                school = student.school

        if not school:
            return Response(
                {"error": "Valid school_id or student_id required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Resolve assigned experience refs via ExperienceAssignment
        assigned_exp_refs = set(
            ExperienceAssignment.objects.filter(school=school)
            .values_list("experience_ref", flat=True)
        )

        pkg_queryset = PublishedPackage.objects.filter(compression_status="COMPLETED")

        # Filter by tenant school assignments
        q_filter = Q(experience__id__in=[
            int(r) for r in assigned_exp_refs if str(r).isdigit()
        ]) | Q(experience__title__in=assigned_exp_refs)

        pkg_queryset = pkg_queryset.filter(q_filter)

        updates = []
        for pkg in pkg_queryset.select_related("experience"):
            version_query = PublishVersion.objects.filter(published_package=pkg)
            if last_synced_at:
                version_query = version_query.filter(published_at__gt=last_synced_at)

            version_obj = version_query.order_by("-published_at").first()
            if version_obj:
                updates.append({
                    "package_id": pkg.id,
                    "experience_id": pkg.experience.id,
                    "title": pkg.experience.title,
                    "version": version_obj.version_number,
                    "download_url": version_obj.download_url or f"/api/lms/packages/{version_obj.id}/download/",
                    "checksum": version_obj.checksum or "",
                    "published_at": version_obj.published_at.isoformat()
                })

        return Response({"updates": updates}, status=status.HTTP_200_OK)


class LMSAnalyticsAPIView(APIView):
    """
    Fetch raw telemetry reports database records for the Content Studio.
    `GET /api/v1/lms/sync/analytics/`
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Fetch StudentProgress
        progress_qs = StudentProgress.objects.select_related("student", "student__user", "student__school").order_by("-last_accessed")
        progress_data = []
        for p in progress_qs:
            progress_data.append({
                "id": p.id,
                "student_name": p.student.user.full_name or p.student.user.username,
                "roll_no": p.student.roll_no,
                "school_name": p.student.school.school_name,
                "scenario_id": p.scenario_id,
                "completed": p.completed,
                "total_time_spent": p.total_time_spent,
                "last_accessed": p.last_accessed.isoformat()
            })

        # Fetch QuizAttempt
        quiz_qs = QuizAttempt.objects.select_related("student", "student__user", "student__school").order_by("-timestamp")
        quiz_data = []
        for q in quiz_qs:
            quiz_data.append({
                "id": q.id,
                "student_name": q.student.user.full_name or q.student.user.username,
                "roll_no": q.student.roll_no,
                "school_name": q.student.school.school_name,
                "scenario_id": q.scenario_id,
                "activity_id": q.activity_id,
                "screen_id": q.screen_id,
                "score": q.score,
                "max_score": q.max_score,
                "answers": q.answers,
                "timestamp": q.timestamp.isoformat()
            })

        # Fetch ActivityReport
        activity_qs = ActivityReport.objects.select_related("student", "student__user", "student__school").order_by("-timestamp")
        activity_data = []
        for a in activity_qs:
            activity_data.append({
                "id": a.id,
                "student_name": a.student.user.full_name or a.student.user.username,
                "roll_no": a.student.roll_no,
                "school_name": a.student.school.school_name,
                "scenario_id": a.scenario_id,
                "activity_id": a.activity_id,
                "time_spent_seconds": a.time_spent_seconds,
                "completed": a.completed,
                "timestamp": a.timestamp.isoformat()
            })

        return Response({
            "progress": progress_data,
            "quizzes": quiz_data,
            "activities": activity_data
        }, status=status.HTTP_200_OK)

