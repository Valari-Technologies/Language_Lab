from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ClassViewSet, TeacherClassViewSet, TeacherViewSet, BulkUploadAPIView


router = DefaultRouter()

router.register(r"teachers", TeacherViewSet, basename="teacher")
router.register(r"classes", ClassViewSet, basename="class")
router.register(r"teacher-classes", TeacherClassViewSet, basename="teacher-class")


urlpatterns = [
    path("", include(router.urls)),
    path("bulk-upload/", BulkUploadAPIView.as_view(), name="bulk-upload"),
]
