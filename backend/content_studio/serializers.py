from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Scenario,
    LearningOutcome,
    ActivitySkill,
    Activity,
    Screen,
    Media,
    ValidationReport,
    PublishedPackage,
    PublishVersion,
    Notification,
)

User = get_user_model()


class LearningOutcomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningOutcome
        fields = ["id", "text", "created_at", "updated_at"]


class ActivitySkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivitySkill
        fields = ["id", "name", "description"]


class ScreenSerializer(serializers.ModelSerializer):
    activity_title = serializers.CharField(source="activity.title", read_only=True)
    screen_type_display = serializers.CharField(source="get_screen_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Screen
        fields = [
            "id",
            "activity",
            "activity_title",
            "title",
            "screen_type",
            "screen_type_display",
            "status",
            "status_display",
            "display_order",
            "content",
            "estimated_duration",
            "created_at",
            "updated_at",
        ]


class ActivitySerializer(serializers.ModelSerializer):
    scenario_title = serializers.CharField(source="scenario.title", read_only=True)
    skills = ActivitySkillSerializer(many=True, read_only=True)

    class Meta:
        model = Activity
        fields = [
            "id",
            "scenario",
            "scenario_title",
            "title",
            "description",
            "learning_objective",
            "skills",
            "estimated_duration",
            "mastery_threshold",
            "display_order",
            "created_at",
            "updated_at",
        ]


class ActivityDetailSerializer(serializers.ModelSerializer):
    scenario_title = serializers.CharField(source="scenario.title", read_only=True)
    skills = ActivitySkillSerializer(many=True, read_only=True)
    screens = ScreenSerializer(many=True, read_only=True)

    class Meta:
        model = Activity
        fields = [
            "id",
            "scenario",
            "scenario_title",
            "title",
            "description",
            "learning_objective",
            "skills",
            "estimated_duration",
            "mastery_threshold",
            "display_order",
            "screens",
            "created_at",
            "updated_at",
        ]


class ScenarioSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source="grade.grade_name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", default="", read_only=True)
    difficulty_display = serializers.CharField(source="get_difficulty_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Scenario
        fields = [
            "id",
            "title",
            "description",
            "grade",
            "grade_name",
            "subject",
            "language",
            "difficulty",
            "difficulty_display",
            "estimated_duration",
            "thumbnail",
            "status",
            "status_display",
            "tags",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]


class ScenarioDetailSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source="grade.grade_name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", default="", read_only=True)
    difficulty_display = serializers.CharField(source="get_difficulty_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    learning_outcomes = LearningOutcomeSerializer(many=True, read_only=True)
    activities = ActivitySerializer(many=True, read_only=True)

    class Meta:
        model = Scenario
        fields = [
            "id",
            "title",
            "description",
            "grade",
            "grade_name",
            "subject",
            "language",
            "difficulty",
            "difficulty_display",
            "estimated_duration",
            "thumbnail",
            "status",
            "status_display",
            "tags",
            "learning_outcomes",
            "activities",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]


class MediaSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source="uploaded_by.full_name", default="", read_only=True)
    media_type_display = serializers.CharField(source="get_media_type_display", read_only=True)

    class Meta:
        model = Media
        fields = [
            "id",
            "name",
            "file",
            "url",
            "media_type",
            "media_type_display",
            "file_size",
            "folder",
            "tags",
            "uploaded_by",
            "uploaded_by_name",
            "upload_date",
        ]


class MediaUsageSerializer(serializers.Serializer):
    scenario_id = serializers.IntegerField()
    scenario_title = serializers.CharField()
    activity_id = serializers.IntegerField()
    activity_title = serializers.CharField()
    screen_id = serializers.IntegerField()
    screen_title = serializers.CharField()


class ValidationReportSerializer(serializers.ModelSerializer):
    scenario_title = serializers.CharField(source="scenario.title", read_only=True)

    class Meta:
        model = ValidationReport
        fields = "__all__"


class PublishVersionSerializer(serializers.ModelSerializer):
    published_by_name = serializers.CharField(source="published_by.full_name", default="", read_only=True)

    class Meta:
        model = PublishVersion
        fields = [
            "id",
            "published_package",
            "version_number",
            "build_number",
            "release_notes",
            "package_size",
            "download_url",
            "published_by",
            "published_by_name",
            "published_at",
        ]


class PublishedPackageSerializer(serializers.ModelSerializer):
    scenario_title = serializers.CharField(source="scenario.title", read_only=True)
    versions = PublishVersionSerializer(many=True, read_only=True)

    class Meta:
        model = PublishedPackage
        fields = [
            "id",
            "scenario",
            "scenario_title",
            "package_name",
            "output_format",
            "compression_status",
            "include_analytics",
            "versions",
            "created_at",
            "updated_at",
        ]


class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source="get_notification_type_display", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "message",
            "notification_type",
            "notification_type_display",
            "user",
            "is_read",
            "created_at",
        ]
