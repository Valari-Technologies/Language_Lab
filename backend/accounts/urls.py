from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import AdminLoginAPIView, StudentLoginAPIView, RegisterAPIView

urlpatterns = [
    # Login Portals
    path("admin/login/", AdminLoginAPIView.as_view(), name="admin_login"),
    path("student/login/", StudentLoginAPIView.as_view(), name="student_login"),

    # Authentication & JWT Actions
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/verify/", TokenVerifyView.as_view(), name="token_verify"),
    
    # User Registration
    path("auth/register/", RegisterAPIView.as_view(), name="register"),
]