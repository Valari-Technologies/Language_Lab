from django.urls import path
from .views import (
    LMSPackageListAPIView,
    LMSPackageDownloadAPIView,
    LMSPackageCheckUpdatesAPIView,
)

urlpatterns = [
    path("", LMSPackageListAPIView.as_view(), name="lms-package-list"),
    path("check-updates/", LMSPackageCheckUpdatesAPIView.as_view(), name="lms-package-check-updates"),
    path("check-updates", LMSPackageCheckUpdatesAPIView.as_view()),
    path("<int:pk>/download/", LMSPackageDownloadAPIView.as_view(), name="lms-package-download"),
    path("<int:pk>/download", LMSPackageDownloadAPIView.as_view()),
]
