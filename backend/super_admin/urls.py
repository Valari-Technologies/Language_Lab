from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    GradeViewSet,
    SchoolViewSet,
    DashboardStatsAPIView,
    SchoolAdminViewSet,
    PublishContentViewSet,
)


router = DefaultRouter()

router.register(r"grades", GradeViewSet, basename="grade")
router.register(r"schools", SchoolViewSet, basename="school")
router.register(r"school-admins", SchoolAdminViewSet, basename="school-admin")
router.register(r"publish-contents", PublishContentViewSet, basename="publish-contents")


urlpatterns = [
    path("dashboard-stats/", DashboardStatsAPIView.as_view(), name="dashboard-stats"),
    path("", include(router.urls)),
]
