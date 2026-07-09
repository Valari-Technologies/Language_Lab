from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import (
    Class,
    Grade,
    PublishContent,
    Scenario,
    ScenarioBuilder,
    School,
    SchoolAdminProfile,
    Student,
    Teacher,
    TeacherClass,
)
from .scoping import get_user_school

User = get_user_model()
class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = '__all__'

class ScenarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scenario
        fields = '__all__'

class ScenarioBuilderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScenarioBuilder
        fields = '__all__'


class GradeDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = '__all__'

class ScenarioDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scenario
        fields = '__all__'

class ScenarioBuilderDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScenarioBuilder
        fields = '__all__'

class PublishContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublishContent
        fields = [
            "publish_id",
            "release_name",
            "grade",
            "total_scenarios",
            "published_by",
            "published_at",
            "status",
            "export_file",
            "checksum",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["publish_id", "published_by", "created_at", "updated_at"]


class PublishContentDetailSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source="grade.grade_name", read_only=True)
    published_by_username = serializers.CharField(source="published_by.username", read_only=True)

    class Meta:
        model = PublishContent
        fields = [
            "publish_id",
            "release_name",
            "grade",
            "grade_name",
            "total_scenarios",
            "published_by",
            "published_by_username",
            "published_at",
            "status",
            "export_file",
            "checksum",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["publish_id", "created_at", "updated_at"]


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'

class SchoolAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    school = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(),
        write_only=True,
        required=False,
    )
    school_id = serializers.IntegerField(source="school_admin_profile.school_id", read_only=True)
    school_name = serializers.CharField(source="school_admin_profile.school.school_name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "role",
            "is_active",
            "password",
            "school",
            "school_id",
            "school_name",
        ]
        extra_kwargs = {
            "role": {"read_only": True},
            "username": {"required": False},
        }

    def validate(self, attrs):
        if not self.instance:
            if "username" not in attrs:
                raise serializers.ValidationError({"username": "Username is required for creation."})
            if "password" not in attrs:
                raise serializers.ValidationError({"password": "Password is required for creation."})
            if "school" not in attrs:
                raise serializers.ValidationError({"school": "School assignment is required for creation."})
            if User.objects.filter(username=attrs["username"]).exists():
                raise serializers.ValidationError({"username": "A user with that username already exists."})
            validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        school = validated_data.pop("school")
        validated_data["role"] = User.Role.SCHOOL_ADMIN
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        SchoolAdminProfile.objects.create(user=user, school=school)
        return user

    def update(self, instance, validated_data):
        school = validated_data.pop("school", None)
        validated_data.pop("username", None)
        validated_data.pop("password", None)
        user = super().update(instance, validated_data)

        if school is not None:
            profile, _ = SchoolAdminProfile.objects.get_or_create(user=user)
            profile.school = school
            profile.save()
        return user


class TeacherSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(required=False)
    full_name = serializers.CharField(required=False)
    is_active = serializers.BooleanField(required=False, default=True)
    school_name = serializers.CharField(source='school.school_name', read_only=True)

    class Meta:
        model = Teacher
        fields = ['teacher_id', 'user', 'username', 'password', 'email', 'full_name', 'is_active', 'school', 'school_name', 'qualification', 'experience_years']
        extra_kwargs = {'user': {'read_only': True}}

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.user:
            ret['username'] = instance.user.username
            ret['email'] = instance.user.email
            ret['full_name'] = instance.user.full_name
            ret['is_active'] = instance.user.is_active
        else:
            ret['username'] = ''
            ret['email'] = ''
            ret['full_name'] = ''
            ret['is_active'] = False
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
                raise serializers.ValidationError({"school": "You can only manage teachers in your own school."})
        return attrs

    def create(self, validated_data):
        username = validated_data.pop('username')
        password = validated_data.pop('password')
        email = validated_data.pop('email', '')
        full_name = validated_data.pop('full_name', '')
        is_active = validated_data.pop('is_active', True)

        # Create the User record
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            full_name=full_name,
            role=User.Role.TEACHER,
            is_active=is_active
        )

        # Create the Teacher record linked to this user
        teacher = Teacher.objects.create(user=user, **validated_data)
        return teacher

    def update(self, instance, validated_data):
        email = validated_data.pop('email', None)
        full_name = validated_data.pop('full_name', None)
        is_active = validated_data.pop('is_active', None)
        validated_data.pop('username', None)
        validated_data.pop('password', None)

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

class ClassSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.school_name', read_only=True)
    grade_name = serializers.CharField(source='grade.grade_name', read_only=True)

    class Meta:
        model = Class
        fields = '__all__'

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.user.role == "SCHOOL_ADMIN":
            admin_school = get_user_school(request.user)
            if not admin_school:
                raise serializers.ValidationError("Your account is not linked to a school.")
            attrs["school"] = admin_school
        return attrs

class TeacherClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherClass
        fields = '__all__'


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

