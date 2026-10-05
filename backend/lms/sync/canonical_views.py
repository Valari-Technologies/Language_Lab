import logging
from decimal import Decimal
from django.db import transaction
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from teacher.models import Student
from content_studio.models import Experience, PublishedPackage
from assessments.models import ExperienceAssignment, StudentAttempt
from lms.models import SyncLog, StudentProgress, QuizAttempt, ActivityReport

logger = logging.getLogger(__name__)


def _get_student(user):
    """Retrieve active Student profile for authenticated user."""
    try:
        return Student.objects.select_related("user", "school").get(user=user)
    except Student.DoesNotExist:
        return None


def _normalize_batch_items(data):
    """Normalize various payload batch structures into a uniform list of items."""
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ["items", "progress", "reports", "events", "attempts"]:
            if key in data and isinstance(data[key], list):
                return data[key]
        return [data]
    return []


class CanonicalProgressSyncAPIView(APIView):
    """
    Canonical Idempotent Progress Synchronization API for Desktop LMS.
    `POST /api/progress/sync/`
    Accepts pending progress batches from authenticated student and safely persists to CMS models.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        student = _get_student(request.user)
        if not student:
            return Response(
                {"error": "Active student profile required."},
                status=status.HTTP_403_FORBIDDEN
            )

        items = _normalize_batch_items(request.data)
        if not items:
            return Response({
                "success": True,
                "synced": [],
                "failed": []
            }, status=status.HTTP_200_OK)

        synced = []
        failed = []

        for index, item in enumerate(items):
            if not isinstance(item, dict):
                failed.append({
                    "progressId": f"item_{index}",
                    "error": "Item must be a JSON object."
                })
                continue

            # 1. Extract and validate unique progress identifier
            progress_id = str(
                item.get("progressId")
                or item.get("eventId")
                or item.get("id")
                or item.get("lms_attempt_id")
                or ""
            ).strip()

            if not progress_id:
                failed.append({
                    "progressId": f"item_{index}",
                    "error": "progressId or eventId is required."
                })
                continue

            # 2. Strict Cross-Student Ownership Validation
            client_student_id = str(
                item.get("studentId")
                or item.get("student_id")
                or item.get("studentRollNumber")
                or ""
            ).strip()

            if client_student_id:
                valid_student_ids = {
                    str(student.student_id),
                    str(student.roll_no or ""),
                    str(request.user.username),
                    str(request.user.id),
                }
                if client_student_id not in valid_student_ids:
                    failed.append({
                        "progressId": progress_id,
                        "error": f"Unauthorized: student identifier '{client_student_id}' does not match authenticated student."
                    })
                    continue

            # 3. Idempotency Check (Safe Retry Detection)
            if SyncLog.objects.filter(idempotency_key=progress_id).exists():
                synced.append({
                    "progressId": progress_id,
                    "status": "synced"
                })
                continue

            # 4. Extract and validate Package / Experience reference
            package_id = str(
                item.get("packageId")
                or item.get("package_id")
                or item.get("experienceId")
                or item.get("experience_id")
                or item.get("experienceRef")
                or item.get("scenarioId")
                or item.get("scenario_id")
                or ""
            ).strip()

            if not package_id:
                failed.append({
                    "progressId": progress_id,
                    "error": "packageId or experienceId is required."
                })
                continue

            exp = None
            if package_id.isdigit():
                pkg_obj = PublishedPackage.objects.filter(id=int(package_id)).select_related("experience").first()
                if pkg_obj:
                    exp = pkg_obj.experience
                else:
                    exp = Experience.objects.filter(id=int(package_id)).first()
            else:
                pkg_obj = PublishedPackage.objects.filter(package_name__iexact=package_id).select_related("experience").first()
                if pkg_obj:
                    exp = pkg_obj.experience
                else:
                    exp = Experience.objects.filter(title__iexact=package_id).first()

            if not exp or exp.is_deleted:
                failed.append({
                    "progressId": progress_id,
                    "error": f"Package '{package_id}' not found or deleted."
                })
                continue

            # 5. Extract and validate score and maxScore
            raw_score = item.get("score") if item.get("score") is not None else item.get("totalScore")
            raw_max_score = item.get("maxScore") if item.get("maxScore") is not None else item.get("max_score")
            max_score = 100.0
            if raw_max_score is not None:
                try:
                    max_score = float(raw_max_score)
                    if max_score < 0:
                        raise ValueError()
                except (TypeError, ValueError):
                    failed.append({
                        "progressId": progress_id,
                        "error": "maxScore must be a positive number."
                    })
                    continue

            score = None
            if raw_score is not None:
                try:
                    score = float(raw_score)
                    if score < 0 or (max_score > 0 and score > max_score):
                        failed.append({
                            "progressId": progress_id,
                            "error": f"score {score} is outside valid range [0, {max_score}]."
                        })
                        continue
                except (TypeError, ValueError):
                    failed.append({
                        "progressId": progress_id,
                        "error": "score must be a numeric value."
                    })
                    continue

            # 6. Extract and validate stars
            stars = item.get("stars")
            if stars is not None:
                try:
                    stars_val = int(stars)
                    if not (0 <= stars_val <= 5):
                        failed.append({
                            "progressId": progress_id,
                            "error": f"stars {stars} must be between 0 and 5."
                        })
                        continue
                except (TypeError, ValueError):
                    failed.append({
                        "progressId": progress_id,
                        "error": "stars must be an integer between 0 and 5."
                    })
                    continue

            # 7. Extract and validate status
            raw_status = str(item.get("status") or "COMPLETED").strip().upper()
            valid_statuses = {"STARTED", "IN_PROGRESS", "COMPLETED", "ABANDONED"}
            if raw_status not in valid_statuses:
                failed.append({
                    "progressId": progress_id,
                    "error": f"Invalid status '{raw_status}'. Must be one of {list(valid_statuses)}."
                })
                continue

            # 8. Extract timestamps and metadata
            completed_at_str = item.get("completedAt") or item.get("completed_at") or item.get("timestamp")
            started_at_str = item.get("startedAt") or item.get("started_at")
            completed_at = parse_datetime(str(completed_at_str)) if completed_at_str else timezone.now()
            started_at = parse_datetime(str(started_at_str)) if started_at_str else (completed_at or timezone.now())

            time_spent = item.get("timeSpentSeconds") or item.get("time_spent_seconds") or item.get("timeSpent") or 0
            try:
                time_spent = int(time_spent)
                if time_spent < 0:
                    time_spent = 0
            except (TypeError, ValueError):
                time_spent = 0

            device_id = str(item.get("deviceId") or item.get("device_id") or "").strip()
            details = item.get("details") or item.get("answers") or item.get("responseData") or {}
            activity_id = str(item.get("levelId") or item.get("activityId") or item.get("activity_id") or "")
            screen_id = str(item.get("screenId") or item.get("screen_id") or "")

            # 9. Transactional Database Ingestion with Row-Level Savepoint
            try:
                with transaction.atomic():
                    # A. Record sync log for future idempotency
                    SyncLog.objects.create(
                        idempotency_key=progress_id,
                        device_id=device_id,
                        student_roll_no=student.roll_no or request.user.username,
                        synced_at=timezone.now()
                    )

                    # B. Update/Create StudentProgress
                    is_completed = (raw_status == "COMPLETED")
                    sp, created = StudentProgress.objects.get_or_create(
                        student=student,
                        scenario_id=str(exp.id),
                        defaults={
                            "completed": is_completed,
                            "total_time_spent": time_spent,
                            "last_accessed": completed_at or timezone.now()
                        }
                    )
                    if not created:
                        if is_completed:
                            sp.completed = True
                        sp.total_time_spent += time_spent
                        sp.last_accessed = completed_at or timezone.now()
                        sp.save()

                    # C. Update/Create ExperienceAssignment
                    assignment, _ = ExperienceAssignment.objects.get_or_create(
                        school=student.school,
                        experience_ref=str(exp.id),
                        defaults={
                            "experience_title": exp.title,
                            "assigned_at": started_at or timezone.now(),
                            "grade": exp.grade
                        }
                    )

                    percentage = None
                    if score is not None and max_score and max_score > 0:
                        percentage = round(Decimal(str(score)) / Decimal(str(max_score)) * 100, 2)

                    StudentAttempt.objects.update_or_create(
                        lms_attempt_id=progress_id,
                        defaults={
                            "assignment": assignment,
                            "student": request.user,
                            "school": student.school,
                            "started_at": started_at or timezone.now(),
                            "completed_at": completed_at if is_completed else None,
                            "status": raw_status,
                            "total_score": Decimal(str(score)) if score is not None else None,
                            "max_score": Decimal(str(max_score)) if max_score is not None else None,
                            "percentage": percentage,
                            "time_spent_seconds": time_spent
                        }
                    )

                    # D. Record QuizAttempt / ActivityReport if activity details exist
                    if activity_id or screen_id or details:
                        QuizAttempt.objects.create(
                            student=student,
                            scenario_id=str(exp.id),
                            activity_id=activity_id,
                            screen_id=screen_id,
                            score=int(score) if score is not None else 0,
                            max_score=int(max_score) if max_score is not None else 100,
                            answers=details if isinstance(details, dict) else {},
                            timestamp=completed_at or timezone.now()
                        )
                        ActivityReport.objects.create(
                            student=student,
                            scenario_id=str(exp.id),
                            activity_id=activity_id,
                            time_spent_seconds=time_spent,
                            completed=is_completed,
                            timestamp=completed_at or timezone.now()
                        )

                    synced.append({
                        "progressId": progress_id,
                        "status": "synced"
                    })
            except Exception as exc:
                logger.error(f"[ProgressSync] Failed processing progressId={progress_id}: {exc}")
                failed.append({
                    "progressId": progress_id,
                    "error": str(exc)
                })

        return Response({
            "success": True,
            "synced": synced,
            "failed": failed
        }, status=status.HTTP_200_OK)


class CanonicalProgressListAPIView(APIView):
    """
    Canonical Authenticated Student Progress Retrieval API for Desktop LMS.
    `GET /api/progress/`
    Returns progress and attempt metrics strictly scoped to the authenticated student.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        student = _get_student(request.user)
        if not student:
            return Response(
                {"error": "Active student profile required."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Strict validation if client passes studentId parameter
        param_student_id = request.query_params.get("studentId") or request.query_params.get("student_id")
        if param_student_id:
            valid_ids = {
                str(student.student_id),
                str(student.roll_no or ""),
                str(request.user.username),
                str(request.user.id),
            }
            if str(param_student_id).strip() not in valid_ids:
                return Response(
                    {"error": "Unauthorized: Cannot request progress for another student."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Authoritative database query strictly filtered to authenticated user
        attempts_qs = (
            StudentAttempt.objects.filter(student=request.user)
            .select_related("assignment", "school")
            .prefetch_related("screen_responses")
            .order_by("-started_at")
        )

        # Optional safe package filtering
        package_id = request.query_params.get("packageId") or request.query_params.get("package_id")
        if package_id:
            attempts_qs = attempts_qs.filter(assignment__experience_ref=str(package_id))

        # Optional updated_since filtering
        updated_since = request.query_params.get("updatedSince") or request.query_params.get("updated_since")
        if updated_since:
            parsed_dt = parse_datetime(str(updated_since))
            if parsed_dt:
                attempts_qs = attempts_qs.filter(synced_at__gte=parsed_dt)

        # Fetch relevant SyncLogs for device_id lookup in bulk to avoid N+1 queries
        attempt_ids = [att.lms_attempt_id for att in attempts_qs if att.lms_attempt_id]
        sync_logs_map = {}
        if attempt_ids:
            for s_log in SyncLog.objects.filter(idempotency_key__in=attempt_ids):
                sync_logs_map[s_log.idempotency_key] = s_log.device_id or ""

        progress_list = []
        for att in attempts_qs:
            screens_data = []
            for sr in att.screen_responses.all():
                screens_data.append({
                    "screenId": sr.screen_ref,
                    "screenTitle": sr.screen_title,
                    "screenType": sr.screen_type,
                    "score": float(sr.score) if sr.score is not None else None,
                    "maxScore": float(sr.max_score) if sr.max_score is not None else None,
                    "isCorrect": sr.is_correct,
                    "timeSpentSeconds": sr.time_spent_seconds or 0,
                    "details": sr.response_data
                })

            progress_list.append({
                "progressId": att.lms_attempt_id,
                "packageId": att.assignment.experience_ref if att.assignment else "",
                "packageTitle": att.assignment.experience_title if att.assignment else "",
                "status": att.status,
                "score": float(att.total_score) if att.total_score is not None else None,
                "maxScore": float(att.max_score) if att.max_score is not None else None,
                "percentage": float(att.percentage) if att.percentage is not None else None,
                "timeSpentSeconds": att.time_spent_seconds or 0,
                "startedAt": att.started_at.isoformat() if att.started_at else None,
                "completedAt": att.completed_at.isoformat() if att.completed_at else None,
                "updatedAt": att.synced_at.isoformat() if att.synced_at else None,
                "deviceId": sync_logs_map.get(att.lms_attempt_id, ""),
                "screens": screens_data,
                "details": {
                    "percentage": float(att.percentage) if att.percentage is not None else None,
                    "screens_count": len(screens_data)
                }
            })

        return Response({
            "success": True,
            "studentId": student.roll_no or request.user.username,
            "studentName": request.user.full_name or request.user.username,
            "progress": progress_list
        }, status=status.HTTP_200_OK)

