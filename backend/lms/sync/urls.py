from django.urls import path
from .views import (
    LMSSyncAttemptAPIView,
    LMSSyncProgressAPIView,
    LMSSyncCompletionAPIView,
)

urlpatterns = [
    path("attempt/", LMSSyncAttemptAPIView.as_view(), name="lms-sync-attempt"),
    path("attempt", LMSSyncAttemptAPIView.as_view()),
    path("progress/", LMSSyncProgressAPIView.as_view(), name="lms-sync-progress"),
    path("progress", LMSSyncProgressAPIView.as_view()),
    path("completion/", LMSSyncCompletionAPIView.as_view(), name="lms-sync-completion"),
    path("completion", LMSSyncCompletionAPIView.as_view()),
]
