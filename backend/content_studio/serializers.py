from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Experience,
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
        fields = ["id", "experience", "text", "created_at", "updated_at"]


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
        read_only_fields = ["display_order"]

    def validate_activity(self, value):
        if value.experience.is_deleted:
            raise serializers.ValidationError("Cannot create or update a screen for a soft-deleted experience.")
        return value

    def validate_content(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Content must be a valid JSON object/dictionary.")
        return value

    def validate(self, attrs):
        return validate_strict_fields(self, attrs)


class ActivitySerializer(serializers.ModelSerializer):
    experience_title = serializers.CharField(source="experience.title", read_only=True)
    skills = ActivitySkillSerializer(many=True, read_only=True)
    skill_ids = serializers.PrimaryKeyRelatedField(
        source="skills", many=True, queryset=ActivitySkill.objects.all(),
        write_only=True, required=False
    )
    title = serializers.CharField(required=False, allow_blank=True)

    screen_count = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = [
            "id",
            "experience",
            "experience_title",
            "title",
            "description",
            "learning_objective",
            "skills",
            "skill_ids",
            "estimated_duration",
            "mastery_threshold",
            "activity_type",
            "display_order",
            "screen_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["display_order", "screen_count"]

    def get_screen_count(self, obj):
        return obj.screens.count()

    def validate_experience(self, value):
        if value.is_deleted:
            raise serializers.ValidationError("Cannot create or update an activity for a soft-deleted experience.")
        return value

    def validate(self, attrs):
        skills = attrs.get("skills", [])
        if skills:
            attrs["title"] = skills[0].name.capitalize()
        elif not self.instance:
            attrs["title"] = "Activity"

        experience = attrs.get("experience")
        if experience and not self.instance:
            if experience.activities.count() >= 6:
                raise serializers.ValidationError("An experience cannot have more than 6 activities.")

        validate_activity_duration(self, attrs)
        return validate_strict_fields(self, attrs)


class ActivityDetailSerializer(serializers.ModelSerializer):
    experience_title = serializers.CharField(source="experience.title", read_only=True)
    skills = ActivitySkillSerializer(many=True, read_only=True)
    skill_ids = serializers.PrimaryKeyRelatedField(
        source="skills", many=True, queryset=ActivitySkill.objects.all(),
        write_only=True, required=False
    )
    title = serializers.CharField(required=False, allow_blank=True)
    screens = ScreenSerializer(many=True, read_only=True)

    class Meta:
        model = Activity
        fields = [
            "id",
            "experience",
            "experience_title",
            "title",
            "description",
            "learning_objective",
            "skills",
            "skill_ids",
            "estimated_duration",
            "mastery_threshold",
            "activity_type",
            "display_order",
            "screens",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["display_order"]

    def validate_experience(self, value):
        if value.is_deleted:
            raise serializers.ValidationError("Cannot create or update an activity for a soft-deleted experience.")
        return value

    def validate(self, attrs):
        skills = attrs.get("skills", [])
        if skills:
            attrs["title"] = skills[0].name.capitalize()
        elif not self.instance:
            attrs["title"] = "Activity"

        experience = attrs.get("experience")
        if experience and not self.instance:
            if experience.activities.count() >= 6:
                raise serializers.ValidationError("An experience cannot have more than 6 activities.")

        validate_activity_duration(self, attrs)
        return validate_strict_fields(self, attrs)


def validate_activity_duration(serializer, attrs):
    experience = attrs.get("experience")
    if not experience and serializer.instance:
        experience = serializer.instance.experience

    if experience and experience.estimated_duration is not None:
        new_duration = attrs.get(
            "estimated_duration",
            serializer.instance.estimated_duration if serializer.instance else 0
        )
        existing_activities = experience.activities.all()
        if serializer.instance:
            existing_activities = existing_activities.exclude(pk=serializer.instance.pk)

        sum_existing = sum(act.estimated_duration or 0 for act in existing_activities)
        total_duration = sum_existing + (new_duration or 0)

        if total_duration > experience.estimated_duration:
            raise serializers.ValidationError({
                "estimated_duration": f"Total duration of activities ({total_duration} min) cannot exceed the lesson estimated duration ({experience.estimated_duration} min)."
            })


def validate_strict_fields(serializer, attrs):
    # Writable fields are fields on the serializer that are NOT read_only
    writable_fields = {
        field_name for field_name, field_obj in serializer.fields.items()
        if not field_obj.read_only
    }
    
    initial_keys = set(serializer.initial_data.keys())
    
    errors = {}
    if "created_by" in initial_keys:
        errors["created_by"] = "Setting created_by is not allowed."
        
    extra_keys = initial_keys - writable_fields
    if "created_by" in extra_keys:
        extra_keys.remove("created_by")
        
    for key in extra_keys:
        errors[key] = "This field is not allowed or is read-only."
        
    if errors:
        raise serializers.ValidationError(errors)
        
    return attrs


class ExperienceSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source="grade.grade_name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", default="", read_only=True)
    difficulty_display = serializers.CharField(source="get_difficulty_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Experience
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
            "experience_type",
            "mastery_threshold",
            "estimated_duration",
            "thumbnail",
            "status",
            "status_display",
            "tags",
            "is_deleted",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by", "is_deleted"]

    def validate(self, attrs):
        return validate_strict_fields(self, attrs)


class ExperienceDetailSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source="grade.grade_name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", default="", read_only=True)
    difficulty_display = serializers.CharField(source="get_difficulty_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    learning_outcomes = LearningOutcomeSerializer(many=True, read_only=True)
    activities = ActivitySerializer(many=True, read_only=True)

    class Meta:
        model = Experience
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
            "experience_type",
            "mastery_threshold",
            "estimated_duration",
            "thumbnail",
            "status",
            "status_display",
            "tags",
            "is_deleted",
            "learning_outcomes",
            "activities",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by", "is_deleted"]

    def validate(self, attrs):
        return validate_strict_fields(self, attrs)


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
            "original_filename",
            "stored_filename",
            "uploaded_by",
            "uploaded_by_name",
            "upload_date",
            "uploaded_at",
        ]
        read_only_fields = [
            "file",
            "url",
            "media_type",
            "file_size",
            "original_filename",
            "stored_filename",
            "uploaded_by",
            "uploaded_at",
        ]

    def validate(self, attrs):
        return validate_strict_fields(self, attrs)


class MediaUploadSerializer(serializers.Serializer):
    file = serializers.FileField(write_only=True, required=True)
    name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    folder = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    tags = serializers.JSONField(required=False, default=list)

    def validate_tags(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Tags must be a JSON array (list).")
        return value

    def validate(self, attrs):
        return validate_strict_fields(self, attrs)


class MediaUsageSerializer(serializers.Serializer):
    experience_id = serializers.IntegerField()
    experience_title = serializers.CharField()
    activity_id = serializers.IntegerField()
    activity_title = serializers.CharField()
    screen_id = serializers.IntegerField()
    screen_title = serializers.CharField()


class ValidationReportSerializer(serializers.ModelSerializer):
    experience_title = serializers.CharField(source="experience.title", read_only=True)
    validated_by_name = serializers.CharField(source="validated_by.full_name", default="", read_only=True)

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
            "file_path",
            "checksum",
            "published_by",
            "published_by_name",
            "published_at",
        ]


class PublishResponseSerializer(serializers.Serializer):
    """Shape returned on a successful POST /publish/{experienceId}/."""
    package_id = serializers.IntegerField()
    version_id = serializers.IntegerField()
    version = serializers.CharField()
    build_number = serializers.IntegerField()
    size = serializers.IntegerField()
    checksum = serializers.CharField()
    elab_filename = serializers.CharField()
    download_url = serializers.CharField()
    published_at = serializers.DateTimeField()


class PublishedPackageSerializer(serializers.ModelSerializer):
    experience_title = serializers.CharField(source="experience.title", read_only=True)
    versions = PublishVersionSerializer(many=True, read_only=True)

    class Meta:
        model = PublishedPackage
        fields = [
            "id",
            "experience",
            "experience_title",
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
