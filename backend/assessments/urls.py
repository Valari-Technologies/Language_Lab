from django.urls import path
from .views import (
    SyncAssignmentsAPIView,
    SyncAttemptsAPIView,
    SyncResponsesAPIView,
    ReportsOverviewAPIView,
    ReportsScenariosAPIView,
    ReportsScenarioDetailAPIView,
    ReportsClassesAPIView,
    ReportsClassDetailAPIView,
    ReportsStudentsAPIView,
    ReportsStudentDetailAPIView,
    ReportsTeachersAPIView,
    ReportsExportAPIView
)

urlpatterns = [
    # Sync endpoints
    path("sync/assignments/", SyncAssignmentsAPIView.as_view(), name="sync_assignments"),
    path("sync/attempts/", SyncAttemptsAPIView.as_view(), name="sync_attempts"),
    path("sync/responses/", SyncResponsesAPIView.as_view(), name="sync_responses"),

    # Reports endpoints
    path("reports/overview/", ReportsOverviewAPIView.as_view(), name="reports_overview"),
    path("reports/scenarios/", ReportsScenariosAPIView.as_view(), name="reports_scenarios"),
    path("reports/scenarios/<str:scenario_ref>/", ReportsScenarioDetailAPIView.as_view(), name="reports_scenario_detail"),
    path("reports/classes/", ReportsClassesAPIView.as_view(), name="reports_classes"),
    path("reports/classes/<int:class_id>/", ReportsClassDetailAPIView.as_view(), name="reports_class_detail"),
    path("reports/students/", ReportsStudentsAPIView.as_view(), name="reports_students"),
    path("reports/students/<int:student_id>/", ReportsStudentDetailAPIView.as_view(), name="reports_student_detail"),
    path("reports/teachers/", ReportsTeachersAPIView.as_view(), name="reports_teachers"),
    path("reports/export/", ReportsExportAPIView.as_view(), name="reports_export"),
]
