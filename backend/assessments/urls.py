from django.urls import path
from .views import (
    SyncAssignmentsAPIView,
    SyncAttemptsAPIView,
    SyncResponsesAPIView,
    ReportsOverviewAPIView,
    ReportsExperiencesAPIView,
    ReportsExperienceDetailAPIView,
    ReportsClassesAPIView,
    ReportsClassDetailAPIView,
    ReportsStudentsAPIView,
    ReportsStudentDetailAPIView,
    ReportsTeachersAPIView,
    ReportsExportAPIView,
    ReportsStudentCompletionAPIView
)

urlpatterns = [
    # Sync endpoints
    path("sync/assignments/", SyncAssignmentsAPIView.as_view(), name="sync_assignments"),
    path("sync/attempts/", SyncAttemptsAPIView.as_view(), name="sync_attempts"),
    path("sync/responses/", SyncResponsesAPIView.as_view(), name="sync_responses"),

    # Reports endpoints
    path("reports/overview/", ReportsOverviewAPIView.as_view(), name="reports_overview"),
    path("reports/experiences/", ReportsExperiencesAPIView.as_view(), name="reports_experiences"),
    path("reports/experiences/<str:experience_ref>/", ReportsExperienceDetailAPIView.as_view(), name="reports_experience_detail"),
    path("reports/classes/", ReportsClassesAPIView.as_view(), name="reports_classes"),
    path("reports/classes/<int:class_id>/", ReportsClassDetailAPIView.as_view(), name="reports_class_detail"),
    path("reports/students/", ReportsStudentsAPIView.as_view(), name="reports_students"),
    path("reports/students/<int:student_id>/", ReportsStudentDetailAPIView.as_view(), name="reports_student_detail"),
    path("reports/teachers/", ReportsTeachersAPIView.as_view(), name="reports_teachers"),
    path("reports/export/", ReportsExportAPIView.as_view(), name="reports_export"),
    path("reports/student-completion/", ReportsStudentCompletionAPIView.as_view(), name="reports_student_completion"),
]
