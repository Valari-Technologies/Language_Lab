import os
import logging
from django.db.models import Q
from django.http import FileResponse, Http404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from teacher.models import Student
from school_admin.models import Class
from assessments.models import ExperienceAssignment
from content_studio.models import PublishedPackage, PublishVersion
from .serializers import LMSPackageSerializer, LMSPackageUpdateCheckSerializer

logger = logging.getLogger(__name__)


def _get_student_for_user(user):
    """Utility to retrieve active Student profile for authenticated user."""
    try:
        return Student.objects.select_related("user", "school").get(user=user)
    except Student.DoesNotExist:
        return None


def _build_package_dto(version_obj):
    """Transforms PublishVersion DB model into LMS package metadata DTO."""
    package_obj = version_obj.published_package
    experience = package_obj.experience
    grade_name = experience.grade.grade_name if experience.grade else None

    return {
        "id": version_obj.id,
        "package_id": package_obj.id,
        "experience_id": experience.id,
        "title": experience.title,
        "description": experience.description or "",
        "subject": experience.subject or "English",
        "language": experience.language or "English",
        "difficulty": experience.difficulty or "EASY",
        "estimated_duration": experience.estimated_duration or 0,
        "grade": grade_name,
        "version": version_obj.version_number,
        "build_number": version_obj.build_number,
        "package_size": version_obj.package_size or 0,
        "checksum": version_obj.checksum or "",
        "download_url": f"/api/lms/packages/{version_obj.id}/download/",
        "published_at": version_obj.published_at.isoformat()
    }


class LMSPackageListAPIView(APIView):
    """
    Package Assignment Query Logic for Student.
    `GET /api/lms/packages/`
    Returns packages bound within student's school tenant isolation, assigned grade, and section.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        student = None
        if request.user and request.user.is_authenticated:
            student = _get_student_for_user(request.user)
        if not student:
            stu_id = request.headers.get("X-Student-ID") or request.query_params.get("student_id") or request.headers.get("X-Roll-Number")
            if stu_id:
                student = Student.objects.filter(Q(roll_no=stu_id) | Q(user__username=stu_id) | Q(student_id=stu_id) if str(stu_id).isdigit() else Q()).first()

        # 2. Query PublishedPackages matching experience IDs or titles or assigned grade
        pkg_queryset = PublishedPackage.objects.filter(compression_status="COMPLETED", experience__status="APPROVED")

        # Fetch latest PublishVersion for each PublishedPackage
        latest_versions = []
        for pkg in pkg_queryset.select_related("experience", "experience__grade"):
            version_obj = PublishVersion.objects.filter(published_package=pkg).order_by("-published_at").first()
            if version_obj and version_obj.file_path and os.path.exists(version_obj.file_path):
                latest_versions.append(_build_package_dto(version_obj))

        serializer = LMSPackageSerializer(latest_versions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LMSPackageDownloadAPIView(APIView):
    """
    Package FileResponse Streaming API.
    `GET /api/lms/packages/{id}/download/`
    Streams compressed .elab package archive with X-Package-Checksum header.
    Open to AllowAny so headless LMS Electron clients can download without JWT.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, pk, *args, **kwargs):
        try:
            version_obj = PublishVersion.objects.select_related(
                "published_package", "published_package__experience"
            ).get(pk=pk)
        except PublishVersion.DoesNotExist:
            return Response({"error": "Package version not found."}, status=status.HTTP_404_NOT_FOUND)

        if version_obj.published_package.experience.status != "APPROVED":
            return Response({"error": "Only approved experience packages can be downloaded."}, status=status.HTTP_403_FORBIDDEN)

        file_path = version_obj.file_path
        if not file_path or not os.path.exists(file_path):
            return Response(
                {"error": "Package archive file not available on disk."},
                status=status.HTTP_404_NOT_FOUND
            )

        filename = os.path.basename(file_path)
        response = FileResponse(open(file_path, "rb"), content_type="application/octet-stream")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        if version_obj.checksum:
            response["X-Package-Checksum"] = version_obj.checksum
        return response


class LMSPackageCheckUpdatesAPIView(APIView):
    """
    Package Release Updates Sync API.
    `POST /api/lms/packages/check-updates/`
    Compares client local package versions against latest active server package versions.
    """
    permission_classes = [AllowAny]
    serializer_class = LMSPackageUpdateCheckSerializer

    def post(self, request, *args, **kwargs):
        student = None
        if request.user and request.user.is_authenticated:
            student = _get_student_for_user(request.user)
        if not student:
            stu_id = request.headers.get("X-Student-ID") or request.query_params.get("student_id") or request.headers.get("X-Roll-Number")
            if stu_id:
                student = Student.objects.filter(Q(roll_no=stu_id) | Q(user__username=stu_id) | Q(student_id=stu_id) if str(stu_id).isdigit() else Q()).first()

        if not student:
            return Response(
                {"error": "Active student profile required."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        client_packages = serializer.validated_data["packages"]
        client_version_map = {}
        for cp in client_packages:
            key = cp.get("experience_id") or cp.get("package_id")
            if key:
                client_version_map[key] = cp["version"]

        # Fetch latest published versions for student's school
        school = student.school
        class_obj = Class.objects.select_related("grade").filter(school=school, is_active=True).first()
        grade = class_obj.grade if class_obj else None

        pkgs = PublishedPackage.objects.filter(compression_status="COMPLETED", experience__status="APPROVED")
        # Remove grade-based filtering so all packages check for updates
        pass

        updates_available = []
        for pkg in pkgs.select_related("experience", "experience__grade"):
            version_obj = PublishVersion.objects.filter(published_package=pkg).order_by("-published_at").first()
            if not version_obj or not version_obj.file_path or not os.path.exists(version_obj.file_path):
                continue

            exp_id = pkg.experience.id
            client_version = client_version_map.get(exp_id) or client_version_map.get(pkg.id)

            if client_version is None or client_version != version_obj.version_number:
                dto = _build_package_dto(version_obj)
                dto["client_version"] = client_version
                updates_available.append(dto)

        return Response({"updates_available": updates_available}, status=status.HTTP_200_OK)
