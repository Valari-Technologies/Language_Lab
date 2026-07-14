from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ScenarioViewSet,
    ActivityViewSet,
    ScreenViewSet,
    MediaViewSet,
    LearningOutcomeViewSet,
    ValidationViewSet,
    PreviewViewSet,
    PublishViewSet,
    PackageViewSet,
    DashboardSummaryAPIView,
    DashboardRecentScenariosAPIView,
    DashboardRecentActivityAPIView,
    DashboardNotificationsAPIView,
)

router = DefaultRouter()
router.register("content/scenarios", ScenarioViewSet, basename="scenario")
router.register("content/activities", ActivityViewSet, basename="activity")
router.register("content/screens", ScreenViewSet, basename="screen")
router.register("content/media", MediaViewSet, basename="media")
router.register("content/learning-outcomes", LearningOutcomeViewSet, basename="learning-outcome")
router.register("content/validation", ValidationViewSet, basename="validation")
router.register("content/preview", PreviewViewSet, basename="preview")

urlpatterns = [
    path("", include(router.urls)),

    # Publish Center
    path("content/publish/<int:scenario_id>/",
         PublishViewSet.as_view({"post": "publish", "get": "status_view"}),
         name="publish-scenario"),
    path("content/publish/history/<int:scenario_id>/",
         PublishViewSet.as_view({"get": "history"}),
         name="publish-history"),

    # Package metadata / download / regenerate
    path("content/packages/<int:pk>/",
         PackageViewSet.as_view({"get": "retrieve"}),
         name="package-detail"),
    path("content/packages/<int:pk>/download/",
         PackageViewSet.as_view({"get": "download"}),
         name="package-download"),
    path("content/packages/<int:pk>/regenerate/",
         PackageViewSet.as_view({"post": "regenerate"}),
         name="package-regenerate"),

    # Dashboard
    path("dashboard/summary", DashboardSummaryAPIView.as_view(), name="dashboard-summary"),
    path("dashboard/recent-scenarios", DashboardRecentScenariosAPIView.as_view(), name="dashboard-recent-scenarios"),
    path("dashboard/recent-activity", DashboardRecentActivityAPIView.as_view(), name="dashboard-recent-activity"),
    path("dashboard/notifications", DashboardNotificationsAPIView.as_view(), name="dashboard-notifications"),
]
