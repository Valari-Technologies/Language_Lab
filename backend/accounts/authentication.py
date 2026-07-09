from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class ActiveUserJWTAuthentication(JWTAuthentication):
    """Reject JWT auth for deactivated accounts."""

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if not user.is_active:
            raise AuthenticationFailed("User account is disabled.", code="user_inactive")
        return user
