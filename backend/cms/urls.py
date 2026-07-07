from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    GradeViewSet,
    ScenarioViewSet,
    ScenarioBuilderViewSet,
    PublishContentViewSet,
    DashboardStatsAPIView,
    SchoolViewSet,
    TeacherViewSet,
    ClassViewSet,
    TeacherClassViewSet,
    StudentViewSet,
)


router = DefaultRouter()


router.register(r"grades", GradeViewSet, basename="grade")
router.register(r"scenarios", ScenarioViewSet, basename="scenario")
router.register(r"scenario-builders", ScenarioBuilderViewSet, basename="scenario-builder")
router.register(r"publish-contents", PublishContentViewSet, basename="publish-content")
router.register(r"schools", SchoolViewSet, basename="school")
router.register(r"teachers", TeacherViewSet, basename="teacher")
router.register(r"classes", ClassViewSet, basename="class")
router.register(r"teacher-classes", TeacherClassViewSet, basename="teacher-class")
router.register(r"students", StudentViewSet, basename="student")


urlpatterns = [
    path("dashboard-stats/", DashboardStatsAPIView.as_view(), name="dashboard-stats"),
    path("", include(router.urls)),
]
