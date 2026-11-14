from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers
from accounts.names import title_name
from accounts.scoping import get_user_school
from super_admin.models import School
from .models import Student
from .rollno import find_roll_conflict, roll_conflict_message, roll_position_changed

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
            lms_code = getattr(instance, "lms_code", None)
            if not lms_code:
                raw_u = instance.user.username or ""
                if raw_u.startswith("sch") and "_" in raw_u:
                    lms_code = raw_u.split("_", 1)[1]
                else:
                    lms_code = raw_u
            ret["username"] = lms_code
            ret["lms_code"] = lms_code
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

    def _check_roll_no(self, attrs, school):
        """No two students of one school, grade and section may share a roll number (1 and 01 are the same)."""
        current = self.instance
        roll_no = attrs.get("roll_no", current.roll_no if current else None)
        grade = attrs.get("grade", current.grade if current else None)
        section = attrs.get("section", current.section if current else None)
        if current and not roll_position_changed(current, roll_no, grade, section):
            return  # an existing duplicate does not block editing the student's other details
        other = find_roll_conflict(school, grade, section, roll_no, current.student_id if current else None)
        if other:
            raise serializers.ValidationError({"roll_no": roll_conflict_message(other, roll_no, grade, section)})

    def validate(self, attrs):
        request = self.context.get("request")
        if not self.instance:
            if request and request.user.role in ["SCHOOL_ADMIN", "TEACHER"]:
                admin_school = get_user_school(request.user)
                if not admin_school:
                    raise serializers.ValidationError("Your account is not linked to a school.")
                attrs["school"] = admin_school
            elif "school" not in attrs or attrs["school"] is None:
                raise serializers.ValidationError({"school": "This field is required."})

            target_school = attrs.get("school")
            roll_no = str(attrs.get("roll_no") or "").strip()
            formatted_roll = roll_no.zfill(2) if (roll_no.isdigit() and len(roll_no) == 1) else roll_no
            raw_code = attrs.get("username", "").strip()
            full_name = attrs.get("full_name", "").strip()
            clean_name = "".join(c for c in full_name if c.isalpha()).upper()
            prefix = clean_name[:3] if len(clean_name) >= 3 else clean_name.ljust(3, "X")
            if not prefix:
                prefix = "STU"

            if not raw_code or raw_code.lower() == "".join(c for c in full_name if c.isalnum()).lower() or raw_code.endswith("_") or (roll_no and raw_code == f"{prefix}_{roll_no}"):
                if formatted_roll:
                    lms_code = f"{prefix}_{formatted_roll}"
                else:
                    lms_code = f"{prefix}_01"
            else:
                lms_code = raw_code.upper()

            # School-scoped conflict check: Is lms_code already taken in THIS school?
            conflict_in_school = Student.objects.filter(
                school=target_school
            ).filter(
                Q(lms_code__iexact=lms_code) | Q(user__username__iexact=lms_code)
            ).first()

            if conflict_in_school:
                raise serializers.ValidationError({
                    "username": f"A student with LMS login code '{lms_code}' already exists in this school. Please choose a different roll number or name."
                })

            # Internal Django User.username must be unique globally across the entire DB
            internal_username = lms_code
            clashing_user = User.objects.filter(username__iexact=internal_username).first()
            if clashing_user:
                # If orphaned user (not attached to any Student), safely remove it
                if not Student.objects.filter(user=clashing_user).exists():
                    clashing_user.delete()
                else:
                    # User belongs to another school's student: scope internally by school ID
                    internal_username = f"sch{target_school.school_id}_{lms_code}"
                    if User.objects.filter(username__iexact=internal_username).exists():
                        internal_username = f"sch{target_school.school_id}_{lms_code}_{timezone.now().strftime('%m%d%H%M%S')}"

            attrs["lms_code"] = lms_code
            attrs["username"] = internal_username
            attrs["password"] = lms_code
            attrs["email"] = f"{lms_code.lower()}_{target_school.school_id}@languagelab.com"
            self._check_roll_no(attrs, attrs.get("school"))
        else:
            if request and request.user.role in ["SCHOOL_ADMIN", "TEACHER"]:
                admin_school = get_user_school(request.user)
                if admin_school and attrs.get("school") and attrs["school"] != admin_school:
                    raise serializers.ValidationError({"school": "You can only manage students in your own school."})
            if {"roll_no", "grade", "section"} & set(attrs):
                self._check_roll_no(attrs, self.instance.school)
        return attrs

    def create(self, validated_data):
        username = validated_data.pop("username")
        password = validated_data.pop("password")
        email = validated_data.pop("email", "")
        full_name = title_name(validated_data.pop("full_name", ""))
        is_active = validated_data.pop("is_active", True)
        lms_code = validated_data.pop("lms_code", username)

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            full_name=full_name,
            role=User.Role.STUDENT,
            is_active=is_active,
        )
        return Student.objects.create(user=user, lms_code=lms_code, **validated_data)

    def update(self, instance, validated_data):
        email = validated_data.pop("email", None)
        full_name = validated_data.pop("full_name", None)
        is_active = validated_data.pop("is_active", None)
        raw_code = validated_data.pop("username", None)
        validated_data.pop("password", None)

        user = instance.user
        if user:
            if email is not None:
                user.email = email
            if full_name is not None:
                user.full_name = title_name(full_name)
            if is_active is not None:
                user.is_active = is_active
            if raw_code is not None:
                new_code = raw_code.strip().upper()
                if new_code and new_code != (instance.lms_code or "").upper():
                    clash = Student.objects.filter(school=instance.school).exclude(student_id=instance.student_id).filter(
                        Q(lms_code__iexact=new_code) | Q(user__username__iexact=new_code)
                    ).exists()
                    if clash:
                        raise serializers.ValidationError({
                            "username": f"A student with LMS login code '{new_code}' already exists in this school."
                        })
                    instance.lms_code = new_code
                    validated_data["lms_code"] = new_code
                    internal_username = new_code
                    if User.objects.filter(username__iexact=internal_username).exclude(id=user.id).exists():
                        internal_username = f"sch{instance.school_id}_{new_code}"
                        if User.objects.filter(username__iexact=internal_username).exclude(id=user.id).exists():
                            internal_username = f"sch{instance.school_id}_{new_code}_{timezone.now().strftime('%m%d%H%M%S')}"
                    user.username = internal_username
            user.save()

        return super().update(instance, validated_data)
