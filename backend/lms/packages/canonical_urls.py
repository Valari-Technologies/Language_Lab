from django.urls import path
from .views import (
    CanonicalPackageListAPIView,
    CanonicalPackageDetailAPIView,
    CanonicalPackageDownloadAPIView,
)

urlpatterns = [
    path("", CanonicalPackageListAPIView.as_view(), name="canonical-package-list"),
    path("<str:package_id>/download/", CanonicalPackageDownloadAPIView.as_view(), name="canonical-package-download"),
    path("<str:package_id>/download", CanonicalPackageDownloadAPIView.as_view()),
    path("<str:package_id>/", CanonicalPackageDetailAPIView.as_view(), name="canonical-package-detail"),
    path("<str:package_id>", CanonicalPackageDetailAPIView.as_view()),
]
