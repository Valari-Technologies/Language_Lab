from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import ValidationError

from accounts.scoping import get_user_school, get_user_school_id
from school_admin.models import Class, Teacher, TeacherClass
from teacher.models import Student
from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    ProfileSerializer,
    ChangePasswordSerializer,
)
from .permissions import IsSuperAdmin, IsInstituteAdmin, IsTeacher

CMS_LOGIN_ROLES = {"SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"}


class LoginAPIView(APIView):
    """
    POST /api/auth/login/
    Unified login endpoint verifying credentials and returning user info along with JWT tokens.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]

        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {"message": "Invalid username or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {"message": "This account has been deactivated."},
                status=status.HTTP_403_FORBIDDEN
            )

        if user.role not in CMS_LOGIN_ROLES and not user.is_superuser:
            return Response(
                {"message": "Access denied. This portal is for administrators and teachers only."},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        user_payload = {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "school_id": get_user_school_id(user),
        }

        return Response(
            {
                "message": "Login successful",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": user_payload,
            },
            status=status.HTTP_200_OK
        )


class LogoutAPIView(APIView):
    """
    POST /api/auth/logout/
    Blacklist the provided refresh token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"message": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception as exc:
            raise ValidationError({"refresh": "Invalid or expired refresh token."}) from exc
        return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)


class SchoolDashboardAPIView(APIView):
    """
    GET /api/school/dashboard/
    Protected endpoint for School Admin Dashboard data.
    """
    permission_classes = [IsAuthenticated, IsInstituteAdmin]

    def get(self, request):
        school = get_user_school(request.user)
        if school is None:
            return Response(
                {"message": "Your account is not linked to a school."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = {
            "school_name": school.school_name,
            "total_teachers": Teacher.objects.filter(school=school).count(),
            "total_students": Student.objects.filter(school=school).count(),
            "active_classes": Class.objects.filter(school=school, is_active=True).count(),
            # No engagement-metric, activity-log, or announcement models exist yet in
            # this codebase -- returning empty/null instead of inventing fake numbers.
            "monthly_engagement_rate": None,
            "recent_activities": [],
            "announcements": [],
        }
        return Response(data, status=status.HTTP_200_OK)


class TeacherDashboardAPIView(APIView):
    """
    GET /api/teacher/dashboard/
    Protected endpoint for Teacher Dashboard data.
    """
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request):
        teacher = Teacher.objects.filter(user=request.user).select_related("school").first()
        if teacher is None:
            return Response(
                {"message": "Your account is not linked to a teacher profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        assigned_classes = list(
            TeacherClass.objects.filter(teacher=teacher)
            .select_related("class_obj")
            .values_list("class_obj__class_name", flat=True)
        )

        data = {
            "assigned_classes": assigned_classes,
            # No Teacher<->Scenario assignment relationship exists in the schema yet.
            "active_scenarios": 0,
            # No Submission/grading model exists in this codebase yet -- returning an
            # empty/zero value instead of inventing fake numbers.
            "grading_queue_count": 0,
            # No lesson-scheduling model exists yet.
            "upcoming_lessons": [],
            # No score/ranking model exists yet.
            "student_rankings": [],
        }
        return Response(data, status=status.HTTP_200_OK)


class RegisterAPIView(CreateAPIView):
    """
    POST /api/auth/register/
    Registration view that allows Super Admin to create accounts.
    Protected by IsSuperAdmin.
    """
    serializer_class = RegisterSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "message": "User registered successfully.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                    "full_name": user.full_name
                }
            },
            status=status.HTTP_201_CREATED
        )


class ProfileAPIView(APIView):
    """
    GET /api/users/profile/   -> the logged-in user's own profile
    PUT/PATCH /api/users/profile/ -> update full_name / email (username and role are read-only)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        return self._update(request)

    def patch(self, request):
        return self._update(request)

    def _update(self, request):
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Profile updated successfully", "user": serializer.data},
            status=status.HTTP_200_OK
        )


class ChangePasswordAPIView(APIView):
    """
    POST /api/users/change-password/
    Requires the logged-in user's current password before setting a new one.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
