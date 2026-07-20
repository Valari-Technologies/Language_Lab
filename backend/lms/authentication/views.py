import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from teacher.models import Student
from school_admin.models import Class
from .serializers import RollNumberLoginSerializer

logger = logging.getLogger(__name__)


class RollNumberLoginAPIView(APIView):
    """
    High-performance passwordless Roll Number Authentication ingestion endpoint for LMS.
    `POST /api/lms/login`
    """
    permission_classes = [AllowAny]
    serializer_class = RollNumberLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        roll_token = serializer.validated_data["roll_number"].strip()

        # 1. Search Student Entity Maps
        student = None
        # Try username exact match first
        student = Student.objects.select_related("user", "school").filter(user__username=roll_token).first()

        # Fallback to student_id if numeric
        if not student and roll_token.isdigit():
            student = Student.objects.select_related("user", "school").filter(student_id=int(roll_token)).first()

        # Fallback to email or full_name exact match
        if not student:
            student = Student.objects.select_related("user", "school").filter(user__email=roll_token).first()
        if not student:
            student = Student.objects.select_related("user", "school").filter(user__full_name=roll_token).first()

        if not student:
            return Response(
                {"error": "Student profile with requested roll number not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # 2. Active Status & Identity Validation Checklist
        user = student.user
        if not user.is_active:
            return Response(
                {"error": "Student profile is inactive. Access denied."},
                status=status.HTTP_403_FORBIDDEN
            )

        if user.role != "STUDENT":
            return Response(
                {"error": "Only student profiles are authorized for LMS roll number authentication."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 3. SimpleJWT Token Ingestion
        refresh = RefreshToken.for_user(user)

        # 4. Resolve Mapped Grade & Class Section Matrices
        # Resolve class associated with student's school
        class_obj = Class.objects.select_related("grade").filter(school=student.school, is_active=True).first()

        grade_data = None
        class_section_data = None

        if class_obj:
            if class_obj.grade:
                grade_data = {
                    "id": class_obj.grade.id,
                    "name": class_obj.grade.grade_name
                }
            class_section_data = {
                "id": class_obj.class_id,
                "name": class_obj.class_name,
                "academic_year": class_obj.academic_year
            }

        payload = {
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token)
            },
            "student": {
                "id": student.student_id,
                "user_id": user.id,
                "roll_number": user.username,
                "full_name": user.full_name or user.username,
                "email": user.email or ""
            },
            "school": {
                "id": student.school.school_id,
                "name": student.school.school_name
            },
            "grade": grade_data,
            "class_section": class_section_data
        }

        return Response(payload, status=status.HTTP_200_OK)
