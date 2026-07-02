from rest_framework import serializers
from .models import Grade, LearningExperience, ExperienceStep, Assessment, Question, Option



class OptionSerializer(serializers.ModelSerializer):
  
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



class QuestionSerializer(serializers.ModelSerializer):
  
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



class AssessmentSerializer(serializers.ModelSerializer):
  
    class Meta:
        model = Assessment
        fields = [
            "id",
            "experience",
            "title",
            "instructions",
            "mastery",
            "total_marks",
            "display_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AssessmentDetailSerializer(serializers.ModelSerializer):
    
    questions = QuestionDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Assessment
        fields = [
            "id",
            "experience",
            "title",
            "instructions",
            "mastery",
            "total_marks",
            "display_order",
            "questions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]




class ExperienceStepSerializer(serializers.ModelSerializer):
  
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




class LearningExperienceSerializer(serializers.ModelSerializer):
    
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




class GradeSerializer(serializers.ModelSerializer):
 
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
