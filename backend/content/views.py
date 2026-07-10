from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsSuperAdmin
from super_admin.views import CMSBaseViewSet
from .models import Scenario, ScenarioBuilder
from .serializers import (
    ScenarioBuilderSerializer,
    ScenarioDetailSerializer,
    ScenarioSerializer,
)


class ScenarioViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    search_fields = ["title", "description", "objective"]
    ordering_fields = ["estimated_duration", "created_at", "title"]
    ordering = ["grade", "-created_at"]

    def get_queryset(self):
        queryset = Scenario.objects.all()
        grade = self.request.query_params.get("grade")
        difficulty = self.request.query_params.get("difficulty")
        scenario_status = self.request.query_params.get("status")

        if grade:
            queryset = queryset.filter(grade_id=grade)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        if scenario_status:
            queryset = queryset.filter(status=scenario_status)

        return queryset

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return ScenarioDetailSerializer
        return ScenarioSerializer


class ScenarioBuilderViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    serializer_class = ScenarioBuilderSerializer
    search_fields = ["title", "content"]
    ordering_fields = ["display_order", "created_at"]
    ordering = ["display_order"]

    def get_queryset(self):
        queryset = ScenarioBuilder.objects.all()
        scenario = self.request.query_params.get("scenario")
        block_type = self.request.query_params.get("block_type")

        if scenario:
            queryset = queryset.filter(scenario_id=scenario)
        if block_type:
            queryset = queryset.filter(block_type=block_type)

        return queryset
