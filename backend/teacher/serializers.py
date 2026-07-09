from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from core.scoping import get_user_school
from .models import Student

User = get_user_model()


class StudentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(required=False)
    full_name = serializers.CharField(required=False)
    is_active = serializers.BooleanField(required=False, default=True)
    school_name = serializers.CharField(source="school.school_name", read_only=True)

    class Meta:
        model = Student
        fields = [
            "student_id",
            "user",
            "username",
            "password",
            "email",
            "full_name",
            "is_active",
            "school",
            "school_name",
        ]
        extra_kwargs = {"user": {"read_only": True}}

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.user:
            ret["username"] = instance.user.username
            ret["email"] = instance.user.email
            ret["full_name"] = instance.user.full_name
            ret["is_active"] = instance.user.is_active
            ret["role"] = instance.user.role
        return ret

    def validate(self, attrs):
        request = self.context.get("request")
        if not self.instance:
            if "username" not in attrs:
                raise serializers.ValidationError({"username": "Username is required for creation."})
            if "password" not in attrs:
                raise serializers.ValidationError({"password": "Password is required for creation."})
            if User.objects.filter(username=attrs["username"]).exists():
                raise serializers.ValidationError({"username": "A user with that username already exists."})
            validate_password(attrs["password"])
            if request and request.user.role == "SCHOOL_ADMIN":
                admin_school = get_user_school(request.user)
                if not admin_school:
                    raise serializers.ValidationError("Your account is not linked to a school.")
                attrs["school"] = admin_school
        elif request and request.user.role == "SCHOOL_ADMIN":
            admin_school = get_user_school(request.user)
            if admin_school and attrs.get("school") and attrs["school"] != admin_school:
                raise serializers.ValidationError({"school": "You can only manage students in your own school."})
        return attrs

    def create(self, validated_data):
        username = validated_data.pop("username")
        password = validated_data.pop("password")
        email = validated_data.pop("email", "")
        full_name = validated_data.pop("full_name", "")
        is_active = validated_data.pop("is_active", True)

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            full_name=full_name,
            role=User.Role.STUDENT,
            is_active=is_active,
        )
        return Student.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        email = validated_data.pop("email", None)
        full_name = validated_data.pop("full_name", None)
        is_active = validated_data.pop("is_active", None)
        validated_data.pop("username", None)
        validated_data.pop("password", None)

        user = instance.user
        if user:
            if email is not None:
                user.email = email
            if full_name is not None:
                user.full_name = full_name
            if is_active is not None:
                user.is_active = is_active
            user.save()

        return super().update(instance, validated_data)
