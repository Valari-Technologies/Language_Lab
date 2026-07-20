import logging
from django.db import transaction
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from teacher.models import Student
from assessments.models import ExperienceAssignment, StudentAttempt, ScreenResponse
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
