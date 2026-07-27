from django.urls import path
from .views import (
    LMSSyncAttemptAPIView,
    LMSSyncProgressAPIView,
    LMSSyncCompletionAPIView,
    LMSIngestReportsAPIView,
    LMSPullUpdatesAPIView,
    LMSAnalyticsAPIView,
)

urlpatterns = [
    path("attempt/", LMSSyncAttemptAPIView.as_view(), name="lms-sync-attempt"),
    path("attempt", LMSSyncAttemptAPIView.as_view()),
    path("progress/", LMSSyncProgressAPIView.as_view(), name="lms-sync-progress"),
    path("progress", LMSSyncProgressAPIView.as_view()),
    path("completion/", LMSSyncCompletionAPIView.as_view(), name="lms-sync-completion"),
    path("completion", LMSSyncCompletionAPIView.as_view()),

    path("ingest-reports/", LMSIngestReportsAPIView.as_view(), name="lms-ingest-reports"),
    path("ingest-reports", LMSIngestReportsAPIView.as_view()),
    path("pull-updates/", LMSPullUpdatesAPIView.as_view(), name="lms-pull-updates"),
    path("pull-updates", LMSPullUpdatesAPIView.as_view()),
    path("analytics/", LMSAnalyticsAPIView.as_view(), name="lms-analytics"),
    path("analytics", LMSAnalyticsAPIView.as_view()),
]
