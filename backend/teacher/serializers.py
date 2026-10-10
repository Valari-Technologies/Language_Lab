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
    academic_year = serializers.CharField(required=False, allow_blank=True, allow_null=True)
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
            "academic_year",
            "is_active",
            "school",
            "school_name",
        ]
        extra_kwargs = {"user": {"read_only": True}}

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret["id"] = instance.student_id
        ret["academic_year"] = instance.academic_year or "2025 - 2026"
        if ret.get("grade"):
            import re
            m = re.search(r"\d+", str(ret["grade"]))
            if m:
                ret["grade"] = f"Class {m.group(0)}"
        if instance.user:
            username = instance.user.username
            if username and instance.user.full_name and instance.roll_no:
                clean_full = "".join(c for c in instance.user.full_name if c.isalnum()).lower()
                clean_roll = str(instance.roll_no).strip()
                formatted_roll = clean_roll.zfill(2) if (clean_roll.isdigit() and len(clean_roll) == 1) else clean_roll
                clean_name = "".join(c for c in instance.user.full_name if c.isalpha()).upper()
                prefix = clean_name[:3] if len(clean_name) >= 3 else clean_name.ljust(3, "X")
                if not prefix:
                    prefix = "STU"
                expected_username = f"{prefix}_{formatted_roll}"
                legacy_username = f"{prefix}_{clean_roll}"
                if (username.lower() == clean_full or username == legacy_username) and username != expected_username:
                    if not User.objects.filter(username=expected_username).exclude(id=instance.user.id).exists():
                        instance.user.username = expected_username
                        instance.user.save(update_fields=["username"])
                        username = expected_username

            ret["username"] = username
            ret["email"] = instance.user.email
            ret["full_name"] = instance.user.full_name
            ret["is_active"] = instance.user.is_active
            ret["role"] = instance.user.role
        return ret

    def validate_grade(self, value):
        if value:
            import re
            match = re.search(r"\d+", str(value))
            if match:
                num = int(match.group(0))
                if num < 3 or num > 8:
                    raise serializers.ValidationError("Class/Grade must be between 3 and 8.")
            else:
                raise serializers.ValidationError("Invalid Class/Grade. Grade 3 to 8 required.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        if not self.instance:
            roll_no = str(attrs.get("roll_no") or "").strip()
            formatted_roll = roll_no.zfill(2) if (roll_no.isdigit() and len(roll_no) == 1) else roll_no
            username = attrs.get("username", "").strip()
            full_name = attrs.get("full_name", "").strip()
            clean_name = "".join(c for c in full_name if c.isalpha()).upper()
            prefix = clean_name[:3] if len(clean_name) >= 3 else clean_name.ljust(3, "X")
            if not prefix:
                prefix = "STU"

            if not username or username.lower() == "".join(c for c in full_name if c.isalnum()).lower() or username.endswith("_") or (roll_no and username == f"{prefix}_{roll_no}"):
                if formatted_roll:
                    username = f"{prefix}_{formatted_roll}"
                else:
                    username = f"{prefix}_01"

            counter = 1
            base_username = username
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1
            attrs["username"] = username
            attrs["password"] = username
            attrs["email"] = f"{username.lower()}@languagelab.com"

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
        username = validated_data.pop("username", None)
        validated_data.pop("password", None)

        user = instance.user
        if user:
            if email is not None:
                user.email = email
            if full_name is not None:
                user.full_name = full_name
            if is_active is not None:
                user.is_active = is_active
            if username and username != user.username:
                if not User.objects.filter(username=username).exclude(id=user.id).exists():
                    user.username = username
            user.save()

        return super().update(instance, validated_data)
