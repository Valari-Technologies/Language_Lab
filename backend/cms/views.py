from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Grade, LearningExperience, ExperienceStep, Assessment, Question, Option
from .serializers import (
    GradeSerializer,
    GradeDetailSerializer,
    LearningExperienceSerializer,
    LearningExperienceDetailSerializer,
    ExperienceStepSerializer,
    AssessmentSerializer,
    AssessmentDetailSerializer,
    QuestionSerializer,
    QuestionDetailSerializer,
    OptionSerializer,
)


class IsSuperAdmin(BasePermission):
    """
    Custom permission to only allow access to SUPER_ADMIN users.
    Ensures safe attribute checking in case request.user doesn't have a role attribute.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (getattr(request.user, "role", None) == "SUPER_ADMIN" or request.user.is_superuser)
        )


class CMSBaseViewSet(viewsets.ModelViewSet):
    """
    Base viewset for CMS APIs to share common authentication, permissions,
    and filter backends, with standardized success messages for creation, updates, and deletion.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    filter_backends = [SearchFilter, OrderingFilter]

    def get_model_name(self):
        """
        Dynamically fetch the verbose name of the model associated with the ViewSet.
        """
        model = getattr(self, "model", None)
        if not model:
            queryset = getattr(self, "queryset", None)
            if queryset is not None:
                model = queryset.model
            else:
                model = self.get_queryset().model
        return model._meta.verbose_name.title() if model else "Object"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                "message": f"{self.get_model_name()} created successfully",
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(
            {
                "message": f"{self.get_model_name()} updated successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": f"{self.get_model_name()} deleted successfully"},
            status=status.HTTP_200_OK
        )


class GradeViewSet(CMSBaseViewSet):
    """
    ViewSet for managing educational grades/levels.
    """
    queryset = Grade.objects.all()
    search_fields = ["grade_name", "description"]
    ordering_fields = ["sort_order", "grade_name", "created_at"]
    ordering = ["sort_order"]

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return GradeDetailSerializer
        return GradeSerializer



class LearningExperienceViewSet(CMSBaseViewSet):
    """
    ViewSet for managing learning experiences.

    Provides query param filtering for grade, difficulty, and status.
    """
    search_fields = ["title", "description", "objective"]
    ordering_fields = ["estimated_duration", "created_at", "title"]
    ordering = ["grade", "-created_at"]

    def get_queryset(self):
        queryset = LearningExperience.objects.all()
        grade = self.request.query_params.get("grade")
        difficulty = self.request.query_params.get("difficulty")
        status = self.request.query_params.get("status")

        if grade:
            queryset = queryset.filter(grade_id=grade)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        if status:
            queryset = queryset.filter(status=status)

        return queryset

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return LearningExperienceDetailSerializer
        return LearningExperienceSerializer


class ExperienceStepViewSet(CMSBaseViewSet):
    """
    ViewSet for managing individual content blocks (steps) within a learning experience.
    Provides query param filtering for experience and block_type.
    """
    serializer_class = ExperienceStepSerializer
    search_fields = ["title", "content"]
    ordering_fields = ["display_order", "created_at"]
    ordering = ["display_order"]

    def get_queryset(self):
        queryset = ExperienceStep.objects.all()
        experience = self.request.query_params.get("experience")
        block_type = self.request.query_params.get("block_type")

        if experience:
            queryset = queryset.filter(experience_id=experience)
        if block_type:
            queryset = queryset.filter(block_type=block_type)

        return queryset


class AssessmentViewSet(CMSBaseViewSet):
    """
    ViewSet for managing learning assessments.
    Provides query param filtering for experience.
    """
    search_fields = ["title", "instructions"]
    ordering_fields = ["display_order", "total_marks", "passing_marks", "created_at"]
    ordering = ["display_order"]

    def get_queryset(self):
        queryset = Assessment.objects.all()
        experience = self.request.query_params.get("experience")

        if experience:
            queryset = queryset.filter(experience_id=experience)

        return queryset

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return AssessmentDetailSerializer
        return AssessmentSerializer


class QuestionViewSet(CMSBaseViewSet):
    """
    ViewSet for managing assessment questions.
    Provides query param filtering for assessment and question_type.
    """
    search_fields = ["question_text"]
    ordering_fields = ["display_order", "marks", "created_at"]
    ordering = ["display_order"]

    def get_queryset(self):
        queryset = Question.objects.all()
        assessment = self.request.query_params.get("assessment")
        question_type = self.request.query_params.get("question_type")

        if assessment:
            queryset = queryset.filter(assessment_id=assessment)
        if question_type:
            queryset = queryset.filter(question_type=question_type)

        return queryset

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return QuestionDetailSerializer
        return QuestionSerializer


class OptionViewSet(CMSBaseViewSet):
    """
    ViewSet for managing question choices/options.
    Provides query param filtering for question and is_correct.
    """
    serializer_class = OptionSerializer
    search_fields = ["option_text"]
    ordering_fields = ["display_order", "created_at"]
    ordering = ["display_order"]

    def get_queryset(self):
        queryset = Option.objects.all()
        question = self.request.query_params.get("question")
        is_correct = self.request.query_params.get("is_correct")

        if question:
            queryset = queryset.filter(question_id=question)
        if is_correct is not None:
            is_correct_bool = is_correct.lower() in ["true", "1", "yes"]
            queryset = queryset.filter(is_correct=is_correct_bool)

        return queryset
