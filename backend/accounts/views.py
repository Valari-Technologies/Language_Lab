from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer, RegisterSerializer
from .permissions import IsSuperAdmin


class BaseLoginAPIView(APIView):
    """
    Base API View containing reusable login verification and token generation logic.
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
        role = serializer.validated_data.get("role")

        # Authenticate user credentials
        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {"message": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Call child implementation hook to validate user role
        allowed, error_msg = self.check_role_allowed(user, role)
        if not allowed:
            return Response(
                {"message": error_msg},
                status=status.HTTP_403_FORBIDDEN
            )

        # Generate access and refresh JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role
                }
            },
            status=status.HTTP_200_OK
        )

    def check_role_allowed(self, user, selected_role):
        """
        Hook method to validate if user role is allowed.
        Must return (bool: allowed, str: error_message)
        """
        raise NotImplementedError("check_role_allowed must be implemented by subclass views.")


class AdminLoginAPIView(BaseLoginAPIView):
    """
    POST /api/admin/login/
    Login portal for Super Admins, Institute Admins, and Teachers.
    Blocks Students with a 403 Forbidden.
    Verifies the user's role matches the selected role if provided.
    """
    def check_role_allowed(self, user, selected_role):
        allowed_roles = ["SUPER_ADMIN", "INSTITUTE_ADMIN", "TEACHER"]
        if user.role not in allowed_roles and not user.is_superuser:
            return False, "Students are not allowed to log in through this portal."
        
        if selected_role:
            if user.role != selected_role:
                # If they are superuser and chose SUPER_ADMIN, allow it
                if user.is_superuser and selected_role == "SUPER_ADMIN":
                    return True, None
                role_display = selected_role.replace("_", " ").title()
                return False, f"You are not authorized to log in as {role_display}."
                
        return True, None


class StudentLoginAPIView(BaseLoginAPIView):
    """
    POST /api/student/login/
    Login portal exclusively for Students.
    Blocks non-Student users with a 403 Forbidden.
    """
    def check_role_allowed(self, user, selected_role):
        if user.role == "STUDENT" and not user.is_superuser:
            return True, None
        return False, "Only students are allowed to log in through this portal."


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