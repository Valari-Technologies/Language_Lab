from rest_framework import serializers
from .models import Grade, LearningExperience, ExperienceStep, Assessment, Question, Option


# =============================================================================
# Option Serializers
# =============================================================================

class OptionSerializer(serializers.ModelSerializer):
    """
    Standard serializer for Option model (used for both read and write operations).
    """
    class Meta:
        model = Option
        fields = [
            "id",
            "question",
            "option_text",
            "is_correct",
            "display_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# =============================================================================
# Question Serializers
# =============================================================================

class QuestionSerializer(serializers.ModelSerializer):
    """
    Flat serializer for Question model (used for write operations: create/update).
    """
    class Meta:
        model = Question
        fields = [
            "id",
            "assessment",
            "question_type",
            "question_text",
            "marks",
            "display_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class QuestionDetailSerializer(serializers.ModelSerializer):
    """
    Nested serializer for Question model (used for read operations: list/retrieve).
    """
    options = OptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = [
            "id",
            "assessment",
            "question_type",
            "question_text",
            "marks",
            "display_order",
            "options",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# =============================================================================
# Assessment Serializers
# =============================================================================

class AssessmentSerializer(serializers.ModelSerializer):
    """
    Flat serializer for Assessment model (used for write operations: create/update).
    """
    class Meta:
        model = Assessment
        fields = [
            "id",
            "experience",
            "title",
            "instructions",
            "passing_marks",
            "total_marks",
            "display_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AssessmentDetailSerializer(serializers.ModelSerializer):
    """
    Nested serializer for Assessment model (used for read operations: list/retrieve).
    """
    questions = QuestionDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Assessment
        fields = [
            "id",
            "experience",
            "title",
            "instructions",
            "passing_marks",
            "total_marks",
            "display_order",
            "questions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# =============================================================================
# ExperienceStep Serializers
# =============================================================================

class ExperienceStepSerializer(serializers.ModelSerializer):
    """
    Serializer for ExperienceStep model (used for both read and write operations).
    """
    class Meta:
        model = ExperienceStep
        fields = [
            "id",
            "experience",
            "block_type",
            "title",
            "content",
            "media_url",
            "display_order",
            "settings",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# =============================================================================
# LearningExperience Serializers
# =============================================================================

class LearningExperienceSerializer(serializers.ModelSerializer):
    """
    Flat serializer for LearningExperience model (used for write operations: create/update).
    """
    class Meta:
        model = LearningExperience
        fields = [
            "id",
            "grade",
            "title",
            "description",
            "objective",
            "estimated_duration",
            "difficulty",
            "status",
            "thumbnail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class LearningExperienceDetailSerializer(serializers.ModelSerializer):
    """
    Nested serializer for LearningExperience model (used for read operations: list/retrieve).
    """
    steps = ExperienceStepSerializer(many=True, read_only=True)
    assessments = AssessmentDetailSerializer(many=True, read_only=True)

    class Meta:
        model = LearningExperience
        fields = [
            "id",
            "grade",
            "title",
            "description",
            "objective",
            "estimated_duration",
            "difficulty",
            "status",
            "thumbnail",
            "steps",
            "assessments",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# =============================================================================
# Grade Serializers
# =============================================================================

class GradeSerializer(serializers.ModelSerializer):
    """
    Flat serializer for Grade model (used for write operations: create/update).
    """
    class Meta:
        model = Grade
        fields = [
            "id",
            "grade_name",
            "description",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class GradeDetailSerializer(serializers.ModelSerializer):
    """
    Nested serializer for Grade model (used for read operations: list/retrieve).
    """
    learning_experiences = LearningExperienceSerializer(many=True, read_only=True)

    class Meta:
        model = Grade
        fields = [
            "id",
            "grade_name",
            "description",
            "sort_order",
            "learning_experiences",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
