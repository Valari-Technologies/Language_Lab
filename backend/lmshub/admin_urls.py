from django.urls import path

from .admin_views import LmsHubOverviewAPIView, LmsHubRemoveDeviceAPIView

urlpatterns = [
    path("overview/", LmsHubOverviewAPIView.as_view(), name="lmshub-admin-overview"),
    path("devices/<int:pk>/remove/", LmsHubRemoveDeviceAPIView.as_view(), name="lmshub-admin-remove-device"),
]
