from django.urls import path

from .views import HubAdminVerifyAPIView, HubProgressAPIView

urlpatterns = [
    path("progress/", HubProgressAPIView.as_view(), name="hub-progress"),
    path("progress", HubProgressAPIView.as_view()),
    path("admin/verify/", HubAdminVerifyAPIView.as_view(), name="hub-admin-verify"),
    path("admin/verify", HubAdminVerifyAPIView.as_view()),
]
