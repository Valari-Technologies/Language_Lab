from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import Grade, PublishContent, Scenario, ScenarioBuilder, School, SchoolAdminProfile

User = get_user_model()


class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = '__all__'


class GradeDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = '__all__'


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'


class ScenarioSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source='grade.grade_name', read_only=True)

    class Meta:
        model = Scenario
        fields = '__all__'


class ScenarioDetailSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source='grade.grade_name', read_only=True)

    class Meta:
        model = Scenario
        fields = '__all__'


class ScenarioBuilderSerializer(serializers.ModelSerializer):
    scenario_title = serializers.CharField(source='scenario.title', read_only=True)

    class Meta:
        model = ScenarioBuilder
        fields = '__all__'


class ScenarioBuilderDetailSerializer(serializers.ModelSerializer):
    scenario_title = serializers.CharField(source='scenario.title', read_only=True)

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
