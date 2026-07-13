from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from accounts.permissions import IsContentCreatorOrSuperAdmin
from .models import (
    Scenario,
    LearningOutcome,
    ActivitySkill,
    Activity,
    Screen,
    Media,
    ValidationReport,
    PublishedPackage,
    PublishVersion,
    Notification,
)
from .serializers import (
    ScenarioSerializer,
    ScenarioDetailSerializer,
    ActivitySerializer,
    ActivityDetailSerializer,
    ScreenSerializer,
    MediaSerializer,
    MediaUsageSerializer,
    NotificationSerializer,
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class ScenarioViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "subject"]
    ordering_fields = ["updated_at", "created_at", "title"]
    ordering = ["-updated_at"]

    def get_queryset(self):
        queryset = Scenario.objects.all().select_related("grade", "created_by")
        grade = self.request.query_params.get("grade")
        status_param = self.request.query_params.get("status")
        difficulty = self.request.query_params.get("difficulty")

        if grade:
            queryset = queryset.filter(grade_id=grade)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)

        return queryset

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ScenarioDetailSerializer
        return ScenarioSerializer


class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]
    queryset = Activity.objects.all().prefetch_related("skills", "screens")
    serializer_class = ActivityDetailSerializer

    @action(detail=True, methods=["get"])
    def screens(self, request, pk=None):
        activity = self.get_object()
        screens = activity.screens.all()
        serializer = ScreenSerializer(screens, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ScreenViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]
    queryset = Screen.objects.all().select_related("activity")
    serializer_class = ScreenSerializer


class MediaViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "folder", "tags"]
    ordering_fields = ["upload_date", "name"]
    ordering = ["-upload_date"]

    def get_queryset(self):
        queryset = Media.objects.all().select_related("uploaded_by")
        media_type = self.request.query_params.get("media_type")
        folder = self.request.query_params.get("folder")

        if media_type:
            queryset = queryset.filter(media_type=media_type)
        if folder:
            queryset = queryset.filter(folder=folder)

        return queryset

    def get_serializer_class(self):
        return MediaSerializer

    @action(detail=True, methods=["get"])
    def usage(self, request, pk=None):
        media = self.get_object()
        all_screens = Screen.objects.all().select_related("activity__scenario")
        usages = []
        for scr in all_screens:
            is_used = False
            content_str = str(scr.content).lower()
            if str(media.id) in content_str:
                is_used = True
            elif media.name.lower() in content_str:
                is_used = True
            elif media.url and media.url.lower() in content_str:
                is_used = True
            elif media.file and media.file.name.lower() in content_str:
                is_used = True

            if is_used:
                usages.append({
                    "scenario_id": scr.activity.scenario.id,
                    "scenario_title": scr.activity.scenario.title,
                    "activity_id": scr.activity.id,
                    "activity_title": scr.activity.title,
                    "screen_id": scr.id,
                    "screen_title": scr.title
                })

        serializer = MediaUsageSerializer(usages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DashboardSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]

    def get(self, request):
        total_scenarios = Scenario.objects.count()
        draft_scenarios = Scenario.objects.filter(status=Scenario.Status.DRAFT).count()
        published_scenarios = Scenario.objects.filter(status=Scenario.Status.PUBLISHED).count()
        total_media_assets = Media.objects.count()

        return Response({
            "total_scenarios": total_scenarios,
            "draft_scenarios": draft_scenarios,
            "published_scenarios": published_scenarios,
            "total_media_assets": total_media_assets
        }, status=status.HTTP_200_OK)


class DashboardRecentScenariosAPIView(APIView):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]

    def get(self, request):
        scenarios = Scenario.objects.all().select_related("grade").order_by("-updated_at")[:5]
        serializer = ScenarioSerializer(scenarios, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DashboardRecentActivityAPIView(APIView):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]

    def get(self, request):
        activities = []
        recent_scenarios = Scenario.objects.all().order_by("-updated_at")[:5]
        for s in recent_scenarios:
            activities.append({
                "id": f"scenario-{s.id}",
                "activity_type": "scenario_edited",
                "message": f"You edited '{s.title}'",
                "timestamp": s.updated_at
            })

        recent_media = Media.objects.all().order_by("-upload_date")[:5]
        for m in recent_media:
            activities.append({
                "id": f"media-{m.id}",
                "activity_type": "media_uploaded",
                "message": f"You uploaded '{m.name}'",
                "timestamp": m.upload_date
            })

        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        recent_activities = activities[:5]

        for act in recent_activities:
            act["timestamp"] = act["timestamp"].isoformat()

        return Response(recent_activities, status=status.HTTP_200_OK)


class DashboardNotificationsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by("-created_at")[:10]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
