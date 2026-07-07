from rest_framework import serializers
from .models import Grade, Scenario, ScenarioBuilder, PublishContent






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

from .models import School, Teacher, Class, TeacherClass
from django.contrib.auth import get_user_model

User = get_user_model()

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'

class TeacherSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    school_name = serializers.CharField(source='school.school_name', read_only=True)

    class Meta:
        model = Teacher
        fields = '__all__'

class ClassSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.school_name', read_only=True)
    grade_name = serializers.CharField(source='grade.grade_name', read_only=True)

    class Meta:
        model = Class
        fields = '__all__'

class TeacherClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherClass
        fields = '__all__'
