from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExperienceViewSet,
    ActivityViewSet,
    ScreenViewSet,
    MediaViewSet,
    LearningOutcomeViewSet,
    ValidationViewSet,
    PreviewViewSet,
    PublishViewSet,
    PackageViewSet,
    DashboardSummaryAPIView,
    DashboardRecentExperiencesAPIView,
    DashboardRecentActivityAPIView,
    DashboardNotificationsAPIView,
    ExperienceAssignAPIView,
    LMSAssignmentOptionsAPIView,
)

router = DefaultRouter()
router.register("content/experiences", ExperienceViewSet, basename="experience")
router.register("content/activities", ActivityViewSet, basename="activity")
router.register("content/screens", ScreenViewSet, basename="screen")
router.register("content/media", MediaViewSet, basename="media")
router.register("content/learning-outcomes", LearningOutcomeViewSet, basename="learning-outcome")
router.register("content/validation", ValidationViewSet, basename="validation")
router.register("content/preview", PreviewViewSet, basename="preview")

urlpatterns = [
    path("", include(router.urls)),

    # Publish Center
    path("content/publish/<int:experience_id>/",
         PublishViewSet.as_view({"post": "publish", "get": "status_view"}),
         name="publish-experience"),
    path("content/publish/history/<int:experience_id>/",
         PublishViewSet.as_view({"get": "history"}),
         name="publish-history"),

    # Package metadata / download / regenerate
    path("content/packages/<int:pk>/",
         PackageViewSet.as_view({"get": "retrieve"}),
         name="package-detail"),
    path("content/packages/<int:pk>/download/",
         PackageViewSet.as_view({"get": "download"}),
         name="package-download"),
    path("content/packages/<int:pk>/preview-json/",
         PackageViewSet.as_view({"get": "preview_json"}),
         name="package-preview-json"),
    path("content/packages/<int:pk>/regenerate/",
         PackageViewSet.as_view({"post": "regenerate"}),
         name="package-regenerate"),


    # Dashboard
    path("dashboard/summary", DashboardSummaryAPIView.as_view(), name="dashboard-summary"),
    path("dashboard/recent-experiences", DashboardRecentExperiencesAPIView.as_view(), name="dashboard-recent-experiences"),
    path("dashboard/recent-activity", DashboardRecentActivityAPIView.as_view(), name="dashboard-recent-activity"),
    path("dashboard/notifications", DashboardNotificationsAPIView.as_view(), name="dashboard-notifications"),

    # Assignment mapping
    path("content/assign-experience/", ExperienceAssignAPIView.as_view(), name="assign-experience"),
    path("content/assign-experience", ExperienceAssignAPIView.as_view()),
    path("content/assignment-options/", LMSAssignmentOptionsAPIView.as_view(), name="assignment-options"),
    path("content/assignment-options", LMSAssignmentOptionsAPIView.as_view()),
]
