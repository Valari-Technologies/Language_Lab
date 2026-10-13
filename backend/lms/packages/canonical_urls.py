from django.urls import path
from .views import (
    CanonicalPackageListAPIView,
    CanonicalPackageDetailAPIView,
    CanonicalPackageDownloadAPIView,
    LevelMapAPIView,
)

urlpatterns = [
    path("", CanonicalPackageListAPIView.as_view(), name="canonical-package-list"),
    path("level-map/", LevelMapAPIView.as_view(), name="canonical-package-level-map"),
    path("level-map", LevelMapAPIView.as_view()),
    path("<str:package_id>/download/", CanonicalPackageDownloadAPIView.as_view(), name="canonical-package-download"),
    path("<str:package_id>/download", CanonicalPackageDownloadAPIView.as_view()),
    path("<str:package_id>/", CanonicalPackageDetailAPIView.as_view(), name="canonical-package-detail"),
    path("<str:package_id>", CanonicalPackageDetailAPIView.as_view()),
]
