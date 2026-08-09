from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class ActiveUserJWTAuthentication(JWTAuthentication):
    """Reject JWT auth for deactivated accounts or inactive schools."""

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if not user.is_active:
            raise AuthenticationFailed("User account is disabled.", code="user_inactive")

        # Verify school is active
        from accounts.scoping import get_user_school
        school_obj = get_user_school(user)
        if school_obj and not school_obj.is_active:
            raise AuthenticationFailed("Your school has been deactivated.", code="school_inactive")

        return user
