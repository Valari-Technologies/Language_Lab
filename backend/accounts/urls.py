from django.urls import path
from .views import CMSLoginAPIView, CommonLoginAPIView

urlpatterns = [
    path("cms/login/", CMSLoginAPIView.as_view(), name="cms_login"),
    path("login/", CommonLoginAPIView.as_view(), name="common_login"),
]
