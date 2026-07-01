from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    GradeViewSet,
    LearningExperienceViewSet,
    ExperienceStepViewSet,
    AssessmentViewSet,
    QuestionViewSet,
    OptionViewSet,
)

# Use DefaultRouter for automatic URL pattern routing
router = DefaultRouter()

# Register all ViewSets to define clean RESTful endpoints
router.register(r"grades", GradeViewSet, basename="grade")
router.register(r"learning-experiences", LearningExperienceViewSet, basename="learning-experience")
router.register(r"experience-steps", ExperienceStepViewSet, basename="experience-step")
router.register(r"assessments", AssessmentViewSet, basename="assessment")
router.register(r"questions", QuestionViewSet, basename="question")
router.register(r"options", OptionViewSet, basename="option")

# Wire up URLs using Django path system
urlpatterns = [
    path("", include(router.urls)),
]
