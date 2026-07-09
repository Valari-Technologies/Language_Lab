from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

from .token_utils import blacklist_user_tokens

User = get_user_model()

REGISTERABLE_ROLES = {User.Role.SCHOOL_ADMIN, User.Role.TEACHER}


class LoginSerializer(serializers.Serializer):
    """
    Serializer for handling user login credentials.
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for registering CMS staff users.
    Only School Admin and Teacher roles can be created through this endpoint.
    """
    password = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.TEACHER)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "role", "full_name")

    def validate_role(self, value):
        if value not in REGISTERABLE_ROLES:
            raise serializers.ValidationError(
                "Only School Admin and Teacher accounts can be registered through this endpoint."
            )
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        return user


class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for the logged-in user viewing/updating their own profile.
    Username and role are intentionally read-only here.
    """
    class Meta:
        model = User
        fields = ("id", "username", "email", "full_name", "role")
        read_only_fields = ("id", "username", "role")


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for the logged-in user changing their own password.
    Requires the current password to prevent hijacking via a stolen session.
    """
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value, user=self.context["request"].user)
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        blacklist_user_tokens(user)
        return user
