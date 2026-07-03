from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer, CommonLoginSerializer


class LoginAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):


        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():

            username = serializer.validated_data["username"]
            password = serializer.validated_data["password"]

            user = authenticate(
                username=username,
                password=password
            )

            if user is None:
                return Response(
                    {
                        "message": "Invalid Username or Password"
                    },
                    status=status.HTTP_401_UNAUTHORIZED
                )


            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Login Successful",

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

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class BaseAuthAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def authenticate_and_generate_tokens(self, request, serializer_class, check_role_func, error_messages=None):
        if error_messages is None:
            error_messages = {}

        serializer = serializer_class(data=request.data)
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
                {"message": error_messages.get("invalid_credentials", "Invalid username or password.")},
                status=status.HTTP_401_UNAUTHORIZED
            )

        role_ok, error_msg = check_role_func(user, serializer.validated_data)
        if not role_ok:
            return Response(
                {"message": error_msg},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Login successful",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "full_name": user.full_name or "",
                    "email": user.email,
                    "role": user.role
                }
            },
            status=status.HTTP_200_OK
        )


class CMSLoginAPIView(BaseAuthAPIView):
    def post(self, request):
        def check_role(user, validated_data):
            if user.role != "SUPER_ADMIN" and not user.is_superuser:
                return False, "Only Super Admin can access the CMS."
            return True, None


        return self.authenticate_and_generate_tokens(
            request=request,
            serializer_class=LoginSerializer,
            check_role_func=check_role,
            error_messages={"invalid_credentials": "Invalid username or password."}
        )


class CommonLoginAPIView(BaseAuthAPIView):
    def post(self, request):
        def check_role(user, validated_data):
            selected_role = validated_data["role"]
            if user.role != selected_role:
                return False, "You are not authorized to access this portal."
            return True, None

        return self.authenticate_and_generate_tokens(
            request=request,
            serializer_class=CommonLoginSerializer,
            check_role_func=check_role,
            error_messages={"invalid_credentials": "Invalid username or password."}
        )
