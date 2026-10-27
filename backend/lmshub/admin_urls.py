from django.urls import path

from .admin_views import LmsHubOverviewAPIView, LmsHubRemoveDeviceAPIView, LmsHubUnlockAPIView

urlpatterns = [
    path("overview/", LmsHubOverviewAPIView.as_view(), name="lmshub-admin-overview"),
    path("unlock/", LmsHubUnlockAPIView.as_view(), name="lmshub-admin-unlock"),
    path("devices/<int:pk>/remove/", LmsHubRemoveDeviceAPIView.as_view(), name="lmshub-admin-remove-device"),
]
