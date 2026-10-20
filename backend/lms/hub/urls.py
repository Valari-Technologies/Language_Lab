from django.urls import path

from .views import HubProgressAPIView

urlpatterns = [
    path("progress/", HubProgressAPIView.as_view(), name="hub-progress"),
    path("progress", HubProgressAPIView.as_view()),
]
