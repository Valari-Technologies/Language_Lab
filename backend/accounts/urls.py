from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import (
    LoginAPIView,
    LogoutAPIView,
    RegisterAPIView,
    SchoolDashboardAPIView,
    TeacherDashboardAPIView,
    ProfileAPIView,
    ChangePasswordAPIView,
)

urlpatterns = [
    # Unified Login Endpoint
    path("auth/login/", LoginAPIView.as_view(), name="login"),
    path("auth/logout/", LogoutAPIView.as_view(), name="logout"),

    # Protected Role Dashboards
    path("school/dashboard/", SchoolDashboardAPIView.as_view(), name="school_dashboard"),
    path("teacher/dashboard/", TeacherDashboardAPIView.as_view(), name="teacher_dashboard"),

    # Authentication & JWT Actions
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/verify/", TokenVerifyView.as_view(), name="token_verify"),

    # User Registration
    path("auth/register/", RegisterAPIView.as_view(), name="register"),

    # Logged-in user's own profile & password
    path("users/profile/", ProfileAPIView.as_view(), name="user-profile"),
    path("users/change-password/", ChangePasswordAPIView.as_view(), name="change-password"),
]