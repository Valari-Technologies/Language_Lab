from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import LoginAPIView, RegisterAPIView, SchoolDashboardAPIView, TeacherDashboardAPIView

urlpatterns = [
    # Unified Login Endpoint
    path("auth/login/", LoginAPIView.as_view(), name="login"),

    # Protected Role Dashboards
    path("school/dashboard/", SchoolDashboardAPIView.as_view(), name="school_dashboard"),
    path("teacher/dashboard/", TeacherDashboardAPIView.as_view(), name="teacher_dashboard"),

    # Authentication & JWT Actions
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/verify/", TokenVerifyView.as_view(), name="token_verify"),
    
    # User Registration
    path("auth/register/", RegisterAPIView.as_view(), name="register"),
]