from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import ValidationError

from cms.scoping import get_user_school_id
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
        data = {
            "school_name": "St. Mary's English Academy",
            "total_teachers": 18,
            "total_students": 340,
            "active_classes": 12,
            "monthly_engagement_rate": "84%",
            "recent_activities": [
                {"id": 1, "activity": "Teacher Sarah added Beginner Vocabulary lesson", "time": "2 hours ago"},
                {"id": 2, "activity": "Assessment 'Weekly Spelling test' completed by 24 students", "time": "4 hours ago"},
                {"id": 3, "activity": "New grade curriculum approved by Admin", "time": "1 day ago"}
            ],
            "announcements": [
                {"id": 1, "title": "System maintenance scheduled", "date": "July 10, 2026"},
                {"id": 2, "title": "Term exam structures update", "date": "July 12, 2026"}
            ]
        }
        return Response(data, status=status.HTTP_200_OK)


class TeacherDashboardAPIView(APIView):
    """
    GET /api/teacher/dashboard/
    Protected endpoint for Teacher Dashboard data.
    """
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request):
        data = {
            "assigned_classes": ["Class 6-A", "Class 6-B", "Class 7-C"],
            "active_scenarios": 5,
            "grading_queue_count": 8,
            "upcoming_lessons": [
                {"id": 1, "class": "Class 6-A", "topic": "Adverbs and Adjectives", "time": "09:00 AM"},
                {"id": 2, "class": "Class 7-C", "topic": "Story Reading & Quiz", "time": "11:30 AM"}
            ],
            "student_rankings": [
                {"name": "Alice Johnson", "score": "98%", "progress": "Excellent"},
                {"name": "Bob Smith", "score": "92%", "progress": "Improving"},
                {"name": "Charlie Brown", "score": "88%", "progress": "Steady"}
            ]
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
