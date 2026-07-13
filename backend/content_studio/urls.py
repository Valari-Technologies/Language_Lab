from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ScenarioViewSet,
    ActivityViewSet,
    ScreenViewSet,
    MediaViewSet,
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

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/summary", DashboardSummaryAPIView.as_view(), name="dashboard-summary"),
    path("dashboard/recent-scenarios", DashboardRecentScenariosAPIView.as_view(), name="dashboard-recent-scenarios"),
    path("dashboard/recent-activity", DashboardRecentActivityAPIView.as_view(), name="dashboard-recent-activity"),
    path("dashboard/notifications", DashboardNotificationsAPIView.as_view(), name="dashboard-notifications"),
]
