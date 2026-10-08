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

CMS_LOGIN_ROLES = {"SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "CONTENT_CREATOR"}


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

        username_input = serializer.validated_data["username"].strip()
        password = serializer.validated_data["password"]

        # Support logging in by email or username
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user_by_email = User.objects.filter(email__iexact=username_input).first()
        if user_by_email:
            username = user_by_email.username
            candidate_user = user_by_email
        else:
            username = username_input
            candidate_user = User.objects.filter(username__iexact=username_input).first()

        # If the account exists but has been deactivated, reject with Access Denied
        if candidate_user and not candidate_user.is_active:
            if candidate_user.role == User.Role.TEACHER:
                msg = "Access denied. Your account has been deactivated. Please contact your school administrator."
            else:
                msg = "Access denied. This account has been deactivated. Please contact your administrator."
            return Response(
                {"message": msg},
                status=status.HTTP_403_FORBIDDEN
            )

        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {"message": "Invalid username or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            msg = (
                "Access denied. Your account has been deactivated. Please contact your school administrator."
                if user.role == User.Role.TEACHER
                else "Access denied. This account has been deactivated. Please contact your administrator."
            )
            return Response(
                {"message": msg},
                status=status.HTTP_403_FORBIDDEN
            )

        if user.role not in CMS_LOGIN_ROLES and not user.is_superuser:
            return Response(
                {"message": "Access denied. This portal is for administrators and teachers only."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Strict profile validation for administrators, teachers, and students
        if user.role == "SCHOOL_ADMIN":
            from super_admin.models import SchoolAdminProfile
            if not SchoolAdminProfile.objects.filter(user=user).exists():
                return Response(
                    {"message": "Access denied. Your School Admin profile was not found or has been deleted."},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.role == "TEACHER":
            from school_admin.models import Teacher
            if not Teacher.objects.filter(user=user).exists():
                return Response(
                    {"message": "Access denied. Your Teacher profile was not found or has been deleted."},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.role == "STUDENT":
            return Response(
                {"message": "Access denied. Students cannot log in to the CMS platform. Student access is restricted to the offline LMS application only."},
                status=status.HTTP_403_FORBIDDEN
            )

        school_obj = get_user_school(user)
        if school_obj and not school_obj.is_active:
            return Response(
                {"message": "Access denied. Your school is inactive or has been blocked."},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        school_obj = get_user_school(user)
        user_payload = {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "phone_no": user.phone_no,
            "profile_picture": user.profile_picture,
            "role": user.role,
            "school_id": school_obj.school_id if school_obj else None,
            "school_name": school_obj.school_name if school_obj else "",
        }

        response = Response(
            {
                "message": "Login successful",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": user_payload,
            },
            status=status.HTTP_200_OK
        )
        # Set refresh token in httpOnly secure cookie
        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            samesite="Strict",
            secure=True
        )
        return response


class TokenRefreshAPIView(APIView):
    """
    POST /api/auth/refresh/
    Refresh JWT access token using the refresh token stored in the HttpOnly cookie.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return Response(
                {"error": "Refresh token is missing from cookies."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token = RefreshToken(refresh_token)
            # Rotate token if configured in SIMPLE_JWT
            new_access = str(token.access_token)
            response_data = {"access": new_access}
            response = Response(response_data, status=status.HTTP_200_OK)
            # If SimpleJWT rotates refresh tokens, set the new one
            from django.conf import settings
            if settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS", False):
                response.set_cookie(
                    key="refresh_token",
                    value=str(token),
                    httponly=True,
                    samesite="Strict",
                    secure=True
                )
            return response
        except Exception as exc:
            return Response(
                {"error": "Invalid or expired refresh token."},
                status=status.HTTP_401_UNAUTHORIZED
            )


class LogoutAPIView(APIView):
    """
    POST /api/auth/logout/
    Blacklist the provided refresh token and clear the cookie.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token") or request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"message": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception as exc:
            pass
        response = Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
        response.delete_cookie("refresh_token")
        return response



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

        assigned_teacher_classes = TeacherClass.objects.filter(
            teacher=teacher,
            class_obj__is_active=True
        ).select_related("class_obj")

        assigned_classes = list(
            assigned_teacher_classes.values_list("class_obj__class_name", flat=True)
        )

        teacher_grade_ids = list(
            assigned_teacher_classes.values_list("class_obj__grade_id", flat=True).distinct()
        )

        from content_studio.models import Experience
        active_experiences_count = Experience.objects.filter(
            is_deleted=False,
            status=Experience.Status.APPROVED,
            grade_id__in=teacher_grade_ids
        ).count()

        data = {
            "assigned_classes": assigned_classes,
            "active_experiences": active_experiences_count,
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
    PUT/PATCH /api/users/profile/ -> update full_name / email / phone_no (username and role are read-only)
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


import random
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from .models import PasswordResetOTP
from .serializers import ForgotPasswordSerializer, ResetPasswordSerializer


class ForgotPasswordAPIView(APIView):
    """
    POST /api/auth/forgot-password/
    Validates email, generates OTP, sends it via SMTP, and saves to database.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            # Extract validation error messages
            errors = serializer.errors
            err_msg = "Validation failed"
            if "email" in errors:
                err_msg = errors["email"][0]
            return Response({"message": err_msg, "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]

        # Generate a 6-digit random code
        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + timedelta(minutes=10)

        # Save to database
        PasswordResetOTP.objects.create(
            email=email,
            otp_code=otp_code,
            expires_at=expires_at
        )

        # Send email
        subject = "Password Reset OTP - Language Lab"
        message = f"Your OTP for password reset is {otp_code}. It is valid for 10 minutes."
        html_message = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e50d5; margin-bottom: 20px;">Language Lab Password Reset</h2>
            <p>You requested to reset your password. Please use the following One-Time Password (OTP) to proceed:</p>
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0; color: #0f2d59;">
                {otp_code}
            </div>
            <p style="font-size: 14px; color: #64748b;">This OTP code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
        """

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False
            )
        except Exception as e:
            return Response(
                {"message": f"Failed to send email: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {"message": "OTP has been generated and sent to your email successfully."},
            status=status.HTTP_200_OK
        )


class ResetPasswordAPIView(APIView):
    """
    POST /api/auth/reset-password/
    Validates OTP, email and resets password for matching users.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            # Extract standard validation error messages
            errors = serializer.errors
            err_msg = "Validation failed"
            if "confirm_password" in errors:
                err_msg = errors["confirm_password"][0]
            elif "new_password" in errors:
                err_msg = errors["new_password"][0]
            elif "otp_code" in errors:
                err_msg = errors["otp_code"][0]
            elif "email" in errors:
                err_msg = errors["email"][0]
            return Response({"message": err_msg, "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        otp_code = serializer.validated_data["otp_code"]
        new_password = serializer.validated_data["new_password"]

        # Validate OTP
        otp_record = PasswordResetOTP.objects.filter(
            email=email,
            otp_code=otp_code,
            is_verified=False,
            expires_at__gt=timezone.now()
        ).order_by("-created_at").first()

        if not otp_record:
            return Response(
                {"message": "Invalid or expired OTP code. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Reset user password
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users = User.objects.filter(email__iexact=email, is_active=True)

        if not users.exists():
            return Response(
                {"message": "No active user matches this email address."},
                status=status.HTTP_400_BAD_REQUEST
            )

        for user in users:
            user.set_password(new_password)
            user.save()

        # Mark OTP as verified
        otp_record.is_verified = True
        otp_record.save()

        return Response(
            {"message": "Your password has been reset successfully. You can now log in with your new password."},
            status=status.HTTP_200_OK
        )


class VerifyOTPAPIView(APIView):
    """
    POST /api/auth/verify-otp/
    Checks if the provided OTP is valid and unexpired for the given email.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        otp_code = request.data.get("otp_code", "").strip()

        if not email or not otp_code:
            return Response({"valid": False, "message": "Email and OTP code are required."}, status=status.HTTP_200_OK)

        # Validate OTP
        otp_record = PasswordResetOTP.objects.filter(
            email=email,
            otp_code=otp_code,
            is_verified=False,
            expires_at__gt=timezone.now()
        ).order_by("-created_at").first()

        if otp_record:
            return Response({"valid": True, "message": "OTP is valid."}, status=status.HTTP_200_OK)
        else:
            return Response({"valid": False, "message": "Invalid or expired OTP code."}, status=status.HTTP_200_OK)


class GoogleLoginAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        code = request.data.get("code")

        if not token and not code:
            return Response({"error": "Google ID Token or Authorization code is required"}, status=status.HTTP_400_BAD_REQUEST)

        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        from django.conf import settings

        try:
            if code:
                # Exchange auth code for ID Token using Flow
                from google_auth_oauthlib.flow import Flow
                flow = Flow.from_client_config(
                    client_config={
                        "web": {
                            "client_id": settings.GOOGLE_CLIENT_ID,
                            "client_secret": settings.GOOGLE_CLIENT_SECRET,
                            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                            "token_uri": "https://oauth2.googleapis.com/token",
                        }
                    },
                    scopes=[
                        "https://www.googleapis.com/auth/userinfo.profile",
                        "https://www.googleapis.com/auth/userinfo.email",
                        "openid"
                    ],
                    redirect_uri="postmessage"
                )
                flow.fetch_token(code=code)
                id_token_jwt = flow.credentials.id_token
            else:
                id_token_jwt = token

            if not id_token_jwt:
                return Response({"error": "Failed to retrieve Google ID Token"}, status=status.HTTP_400_BAD_REQUEST)

            # Verify the ID Token securely using Google client libraries
            idinfo = id_token.verify_oauth2_token(
                id_token_jwt,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )

            # Verify token issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')

            # Extract user attributes
            email = idinfo.get('email')
            google_id = idinfo.get('sub')
            name = idinfo.get('name', '')
            picture = idinfo.get('picture', '')

            if not email:
                return Response({"error": "Email is required but not provided by Google account"}, status=status.HTTP_400_BAD_REQUEST)

        except ValueError as e:
            return Response({"error": f"Invalid Google token: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Token verification failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Check existing user by Google ID
        user = User.objects.filter(google_id=google_id).first()

        # Or fallback by matching Email address
        if not user:
            user = User.objects.filter(email__iexact=email).first()
            if user:
                user.google_id = google_id
                if picture and not user.profile_picture:
                    user.profile_picture = picture
                user.save(update_fields=['google_id', 'profile_picture'])

        if not user:
            return Response(
                {"message": "Your Google account is not registered. Please contact your administrator."},
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.is_active:
            msg = (
                "Access denied. Your account has been deactivated. Please contact your school administrator."
                if user.role == User.Role.TEACHER
                else "Access denied. This account has been deactivated. Please contact your administrator."
            )
            return Response(
                {"message": msg},
                status=status.HTTP_403_FORBIDDEN
            )

        # Block Student logins from accessing CMS via Google Login
        if user.role == "STUDENT":
            return Response(
                {"message": "Access denied. Students must log in via the Desktop LMS application only."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Enforce profile checks for School Admin and Teacher
        if user.role == "SCHOOL_ADMIN":
            from super_admin.models import SchoolAdminProfile
            if not SchoolAdminProfile.objects.filter(user=user).exists():
                return Response(
                    {"message": "Access denied. Your School Admin profile was not found or has been deleted."},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.role == "TEACHER":
            from school_admin.models import Teacher
            if not Teacher.objects.filter(user=user).exists():
                return Response(
                    {"message": "Access denied. Your Teacher profile was not found or has been deleted."},
                    status=status.HTTP_403_FORBIDDEN
                )

        school_obj = get_user_school(user)
        if school_obj and not school_obj.is_active:
            return Response(
                {"message": "Access denied. Your school is inactive or has been blocked."},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        school_obj = get_user_school(user)
        user_payload = {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name or user.username,
            "email": user.email,
            "role": user.role,
            "profile_picture": user.profile_picture,
            "school_id": school_obj.school_id if school_obj else None,
            "school_name": school_obj.school_name if school_obj else "",
        }

        return Response({
            "message": "Login successful",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": user_payload,
        }, status=status.HTTP_200_OK)


class ProfileAvatarUploadAPIView(APIView):
    """
    POST /api/users/profile/avatar/
    Uploads a new avatar/profile photo and saves it locally, updating the user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        import os
        import uuid
        from django.core.files.storage import default_storage
        from django.utils.text import get_valid_filename

        avatar_file = request.FILES.get("avatar")
        if not avatar_file:
            return Response({"error": "No avatar file provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        ext = os.path.splitext(avatar_file.name)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
            return Response({"error": "Unsupported image format. Allowed formats: PNG, JPG, JPEG, WEBP, GIF."}, status=status.HTTP_400_BAD_REQUEST)

        safe_name = get_valid_filename(f"avatar_{uuid.uuid4().hex[:10]}{ext}")
        saved_path = default_storage.save(f"avatars/{safe_name}", avatar_file)
        
        url = request.build_absolute_uri(default_storage.url(saved_path))
        
        user = request.user
        user.profile_picture = url
        user.save(update_fields=["profile_picture"])

        return Response({
            "message": "Avatar uploaded successfully.",
            "profile_picture": url
        }, status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        user = request.user
        user.profile_picture = None
        user.save(update_fields=["profile_picture"])
        return Response({
            "message": "Avatar removed successfully.",
            "profile_picture": None
        }, status=status.HTTP_200_OK)


