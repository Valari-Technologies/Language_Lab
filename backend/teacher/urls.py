from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .reports import TeacherReportsAPIView
from .views import StudentViewSet


router = DefaultRouter()

router.register(r"students", StudentViewSet, basename="student")


urlpatterns = [
    path("teacher/reports/", TeacherReportsAPIView.as_view(), name="teacher-reports"),
    path("", include(router.urls)),
]
