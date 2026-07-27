from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from accounts.scoping import get_user_school
from super_admin.models import School
from .models import Student

User = get_user_model()


class StudentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(required=False)
    full_name = serializers.CharField(required=False)
    roll_no = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    grade = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    section = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    is_active = serializers.BooleanField(required=False, default=True)
    school_name = serializers.CharField(source="school.school_name", read_only=True)
    school = serializers.PrimaryKeyRelatedField(queryset=School.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Student
        fields = [
            "student_id",
            "user",
            "username",
            "password",
            "email",
            "full_name",
            "roll_no",
            "grade",
            "section",
            "is_active",
            "school",
            "school_name",
        ]
        extra_kwargs = {"user": {"read_only": True}}

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret["id"] = instance.student_id
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
            # Student login credential IS the roll number.
            # username = roll_no, default password = roll_no.
            roll_no = attrs.get("roll_no", "").strip()
            if not roll_no:
                raise serializers.ValidationError({"roll_no": "Roll No is required to create a student account."})

            # Use roll_no as the username (login credential).
            # If a duplicate exists (e.g. same roll_no in another school), append a suffix.
            username = roll_no
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{roll_no}_{counter}"
                counter += 1
            attrs["username"] = username

            # Default password = roll_no so the student can log in immediately.
            attrs["password"] = roll_no

            # Auto-generate a placeholder email.
            attrs["email"] = f"{username}@languagelab.com"

            if request and request.user.role in ["SCHOOL_ADMIN", "TEACHER"]:
                admin_school = get_user_school(request.user)
                if not admin_school:
                    raise serializers.ValidationError("Your account is not linked to a school.")
                attrs["school"] = admin_school
            elif "school" not in attrs or attrs["school"] is None:
                raise serializers.ValidationError({"school": "This field is required."})
        elif request and request.user.role in ["SCHOOL_ADMIN", "TEACHER"]:
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
