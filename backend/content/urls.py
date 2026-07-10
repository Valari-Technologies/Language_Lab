from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ScenarioBuilderViewSet, ScenarioViewSet


router = DefaultRouter()

router.register(r"scenarios", ScenarioViewSet, basename="scenario")
router.register(r"scenario-builders", ScenarioBuilderViewSet, basename="scenario-builder")


urlpatterns = [
    path("", include(router.urls)),
]
