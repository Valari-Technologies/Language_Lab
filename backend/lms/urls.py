from django.urls import path, include
from lms.authentication.views import RollNumberLoginAPIView

urlpatterns = [
    path("login/", RollNumberLoginAPIView.as_view(), name="lms-login"),
    path("login", RollNumberLoginAPIView.as_view()),
    path("packages/", include("lms.packages.urls")),
    path("dashboard/", include("lms.dashboard.urls")),
    path("sync/", include("lms.sync.urls")),
]
