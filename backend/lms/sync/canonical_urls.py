from django.urls import path
from .canonical_views import (
    CanonicalProgressSyncAPIView,
    CanonicalProgressListAPIView,
)

urlpatterns = [
    path("", CanonicalProgressListAPIView.as_view(), name="canonical-progress-list"),
    path("sync/", CanonicalProgressSyncAPIView.as_view(), name="canonical-progress-sync"),
    path("sync", CanonicalProgressSyncAPIView.as_view()),
]
