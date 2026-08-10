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
    throttle_classes = []

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
    throttle_classes = []

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
    throttle_classes = []

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


from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class LMSIngestReportsAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = []

    def post(self, request, *args, **kwargs):
        """
        Ingest analytics, assessment scores, and completion reports 
        sent from offline/online LMS Electron clients.
        """
        try:
            from django.utils import timezone
            data = request.data
            logger.info(f"[LMS Ingest] Received report payload: {data}")

            student_roll = data.get('studentRollNumber')
            student = Student.objects.filter(roll_no=student_roll).first()
            if not student:
                student = Student.objects.filter(user__username=student_roll).first()
            if not student:
                return Response({"error": f"Student not found with roll number: {student_roll}"}, status=status.HTTP_404_NOT_FOUND)

            reports = data.get('reports', [])
            processed_keys = []

            for r in reports:
                ikey = r.get('idempotencyKey')
                if not ikey:
                    continue
                scenario_id = str(r.get('scenarioId'))
                activity_id = r.get('activityId')
                screen_id = r.get('screenId')
                score = r.get('score', 0)
                max_score = r.get('maxScore', 10)
                time_spent = r.get('timeSpentSeconds', 0)
                completed = r.get('completed', False)
                answers = r.get('answers', {})

                if SyncLog.objects.filter(idempotency_key=ikey).exists():
                    processed_keys.append(ikey)
                    continue

                with transaction.atomic():
                    SyncLog.objects.create(
                        idempotency_key=ikey,
                        client_device_id=data.get('deviceId', ''),
                        sync_type='INGEST_REPORT',
                        status='SUCCESS'
                    )

                    sp, created = StudentProgress.objects.get_or_create(
                        student=student,
                        scenario_id=scenario_id,
                        defaults={
                            'completed': completed,
                            'total_time_spent': time_spent,
                            'synced_at': timezone.now()
                        }
                    )
                    if not created:
                        sp.completed = completed
                        sp.total_time_spent = time_spent
                        sp.save()

                    QuizAttempt.objects.create(
                        student=student,
                        scenario_id=scenario_id,
                        screen_id=screen_id,
                        score=score,
                        max_score=max_score,
                        answers=answers
                    )

                    ActivityReport.objects.create(
                        student=student,
                        scenario_id=scenario_id,
                        activity_id=activity_id,
                        completed=completed
                    )

                processed_keys.append(ikey)

            return Response({
                "status": "success",
                "message": "Report ingested successfully",
                "processedKeys": processed_keys,
                "received_student": student_roll
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"[LMS Ingest] Error processing report: {str(e)}")
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class LMSPullUpdatesAPIView(APIView):
    """
    Outbound Data & Config Endpoint.
    `GET /api/v1/lms/sync/pull-updates/`
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = []

    def get(self, request, *args, **kwargs):
        student_id = request.query_params.get("student_id")
        school_id = request.query_params.get("school_id")
        last_synced_at_str = request.query_params.get("last_synced_at")

        last_synced_at = None
        if last_synced_at_str:
            last_synced_at = parse_datetime(last_synced_at_str)

        # Resolve school context — gracefully fall back to all packages if absent
        school = None
        if school_id:
            if str(school_id).isdigit():
                school = School.objects.filter(school_id=int(school_id)).first()
        elif student_id:
            student_obj = None
            if str(student_id).isdigit():
                student_obj = Student.objects.filter(student_id=int(student_id)).first()
            
            if not student_obj:
                # Search by roll_number or roll_no or username
                student_obj = Student.objects.filter(
                    Q(roll_no=student_id) | Q(user__username=student_id)
                ).first()
                
            if student_obj:
                school = student_obj.school

        # Build base queryset
        pkg_queryset = PublishedPackage.objects.filter(
            compression_status="COMPLETED",
            experience__status="APPROVED"
        ).select_related("experience")

        # Scoping to assigned experiences bypassed to send all packages to LMS
        pass

        # Build absolute base URL for download links
        base_url = request.build_absolute_uri("/").rstrip("/")

        packages = []
        for pkg in pkg_queryset:
            version_query = PublishVersion.objects.filter(published_package=pkg)
            if last_synced_at:
                version_query = version_query.filter(published_at__gt=last_synced_at)

            version_obj = version_query.order_by("-published_at").first()
            if not version_obj:
                continue

            raw_download = version_obj.download_url or f"/api/lms/packages/{version_obj.id}/download/"
            download_url = raw_download if raw_download.startswith("http") else f"{base_url}{raw_download}"

            packages.append({
                "package_id": pkg.id,
                "experience_id": pkg.experience.id,
                "title": pkg.experience.title,
                "version": version_obj.version_number,
                "download_url": download_url,
                "checksum": version_obj.checksum or "",
                "published_at": version_obj.published_at.isoformat(),
            })

        return Response(
            {"status": "success", "packages": packages, "updates": packages},
            status=status.HTTP_200_OK,
        )


class LMSStudentRollNoAuthAPIView(APIView):
    """
    Roll-Number-based Student Authentication & Package Discovery for headless LMS clients.
    `POST /api/v1/lms/auth/student-login/`

    Request body: {"roll_number": "STU-101"}

    Returns student identity data plus all published .elab packages assigned to the
    student's school/grade, with absolute download URLs constructed from the request host.
    """
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = []

    def post(self, request, *args, **kwargs):
        roll_number = (request.data.get("roll_number") or "").strip()
        if not roll_number:
            return Response(
                {"error": "roll_number is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # --- 1. Resolve student by roll_no field (primary), then username fallback ---
        student = (
            Student.objects.select_related("user", "school")
            .filter(roll_no=roll_number)
            .first()
        )
        if not student:
            # Fallback: the roll number may be stored as the Django username
            student = (
                Student.objects.select_related("user", "school")
                .filter(user__username=roll_number)
                .first()
            )

        if not student:
            return Response(
                {"error": "Invalid Roll Number"},
                status=status.HTTP_404_NOT_FOUND
            )

        user = student.user
        if not user.is_active:
            return Response(
                {"error": "Student account is inactive."},
                status=status.HTTP_403_FORBIDDEN
            )

        # --- 2. Resolve grade label ---
        grade_label = student.grade or ""

        # Try to get a richer grade name from the associated Class → Grade
        from school_admin.models import Class as SchoolClass
        class_obj = (
            SchoolClass.objects.select_related("grade")
            .filter(school=student.school, is_active=True)
            .first()
        )
        if class_obj and class_obj.grade:
            grade_label = class_obj.grade.grade_name

        # --- 3. Resolve assigned published packages for this school ---
        assigned_exp_refs = set(
            ExperienceAssignment.objects.filter(school=student.school)
            .values_list("experience_ref", flat=True)
        )

        pkg_queryset = PublishedPackage.objects.filter(
            compression_status="COMPLETED",
            experience__status="APPROVED"
        ).select_related("experience")

        if assigned_exp_refs:
            q_filter = Q(experience__id__in=[
                int(r) for r in assigned_exp_refs if str(r).isdigit()
            ]) | Q(experience__title__in=assigned_exp_refs)
            pkg_queryset = pkg_queryset.filter(q_filter)

        # Build absolute base URL (e.g. http://10.25.103.31:8000)
        base_url = request.build_absolute_uri("/").rstrip("/")

        assigned_packages = []
        for pkg in pkg_queryset:
            version_obj = (
                PublishVersion.objects
                .filter(published_package=pkg)
                .order_by("-published_at")
                .first()
            )
            if not version_obj:
                continue

            # Resolve download URL — prefer stored URL, fall back to package-download endpoint
            raw_download = version_obj.download_url or f"/api/lms/packages/{version_obj.id}/download/"
            if raw_download.startswith("http"):
                download_url = raw_download
            else:
                download_url = f"{base_url}{raw_download}"

            assigned_packages.append({
                "package_id": str(pkg.experience.id),
                "title": pkg.experience.title,
                "download_url": download_url,
                "version": version_obj.version_number,
                "checksum": version_obj.checksum or "",
            })

        return Response(
            {
                "status": "success",
                "student": {
                    "id": student.student_id,
                    "name": user.full_name or user.username,
                    "roll_number": student.roll_no or user.username,
                    "school_id": student.school.school_id,
                    "grade": grade_label,
                },
                "assigned_packages": assigned_packages,
            },
            status=status.HTTP_200_OK,
        )
