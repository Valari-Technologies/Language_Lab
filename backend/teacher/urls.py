from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .reports import TeacherReportsAPIView, TeacherStudentDayReportAPIView
from .views import StudentViewSet


router = DefaultRouter()

router.register(r"students", StudentViewSet, basename="student")


urlpatterns = [
    path("teacher/reports/", TeacherReportsAPIView.as_view(), name="teacher-reports"),
    path("teacher/reports/students/<int:student_id>/day/", TeacherStudentDayReportAPIView.as_view(), name="teacher-reports-student-day"),
    path("", include(router.urls)),
]
