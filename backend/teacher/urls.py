from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .class_report import TeacherClassReportAPIView
from .reports import TeacherReportsAPIView, TeacherStudentDayReportAPIView
from .student_report import TeacherStudentReportAPIView
from .views import StudentViewSet


router = DefaultRouter()

router.register(r"students", StudentViewSet, basename="student")


urlpatterns = [
    path("teacher/reports/", TeacherReportsAPIView.as_view(), name="teacher-reports"),
    path("teacher/reports/class/", TeacherClassReportAPIView.as_view(), name="teacher-reports-class"),
    path("teacher/reports/students/<int:student_id>/day/", TeacherStudentDayReportAPIView.as_view(), name="teacher-reports-student-day"),
    path("teacher/reports/students/<int:student_id>/report/", TeacherStudentReportAPIView.as_view(), name="teacher-reports-student-report"),
    path("", include(router.urls)),
]
