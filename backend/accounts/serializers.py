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
    school_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    full_name = serializers.CharField(required=True, allow_blank=False, max_length=255)
    email = serializers.EmailField(required=True, allow_blank=False)
    phone_no = serializers.CharField(required=True, allow_blank=False, max_length=20)

    class Meta:
        model = User
        fields = ("id", "username", "email", "full_name", "phone_no", "role", "school_name", "profile_picture")
        read_only_fields = ("id", "username", "role")

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret["school_name"] = self.get_school_name(instance)
        return ret

    def get_school_name(self, obj):
        if hasattr(obj, "school_admin_profile") and obj.school_admin_profile.school:
            return obj.school_admin_profile.school.school_name
        if hasattr(obj, "teacher_profile") and obj.teacher_profile.school:
            return obj.teacher_profile.school.school_name
        if hasattr(obj, "schools_administered") and obj.schools_administered.exists():
            return obj.schools_administered.first().school_name
        return ""

    def validate_full_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Full name is required.")
        return value.strip()

    def validate_email(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Email address is required.")
        email = value.strip().lower()
        qs = User.objects.filter(email__iexact=email)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return email

    def validate_phone_no(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError("Phone number is required.")
        val_str = str(value).strip()
        cleaned = "".join(c for c in val_str if c.isdigit())
        if len(cleaned) != 10 or len(val_str) != 10:
            raise serializers.ValidationError("Phone number must be exactly 10 numeric digits.")
        return cleaned

    def validate(self, attrs):
        user = self.instance or getattr(self.context.get("request"), "user", None)
        if user and user.role == User.Role.SCHOOL_ADMIN:
            if "school_name" in attrs:
                s_name = attrs.get("school_name")
                if s_name is not None and not str(s_name).strip():
                    raise serializers.ValidationError({"school_name": "School name cannot be empty."})
        return attrs

    def update(self, instance, validated_data):
        school_name = validated_data.pop("school_name", None)
        user = super().update(instance, validated_data)

        if school_name is not None and user.role == User.Role.SCHOOL_ADMIN:
            cleaned_s_name = str(school_name).strip()
            if cleaned_s_name:
                if hasattr(user, "school_admin_profile") and user.school_admin_profile.school:
                    school = user.school_admin_profile.school
                    school.school_name = cleaned_s_name
                    if school.schoolAdminId is None:
                        school.schoolAdminId = user
                    school.save()
                if user.schools_administered.exists():
                    for s in user.schools_administered.all():
                        s.school_name = cleaned_s_name
                        s.save()

        return user


from django.core.exceptions import ValidationError as DjangoValidationError

class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for the logged-in user changing their own password.
    Requires the current password to prevent hijacking via a stolen session.
    """
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=False)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        try:
            validate_password(value, user=self.context["request"].user)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        confirm = attrs.get("confirm_password")
        if confirm is not None and attrs.get("new_password") != confirm:
            raise serializers.ValidationError({"confirm_password": "New password and confirm password do not match."})
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        blacklist_user_tokens(user)
        return user


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        email = value.strip().lower()
        if not User.objects.filter(email__iexact=email, is_active=True).exists():
            raise serializers.ValidationError("No active user found with this email address.")
        return email


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp_code = serializers.CharField(max_length=6, min_length=6, required=True)
    new_password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        if attrs.get("new_password") != attrs.get("confirm_password"):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

