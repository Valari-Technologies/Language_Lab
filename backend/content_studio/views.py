from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser

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
    MediaUploadSerializer,
    MediaUsageSerializer,
    NotificationSerializer,
    LearningOutcomeSerializer,
    ValidationReportSerializer,
    PublishVersionSerializer,
    PublishedPackageSerializer,
    PublishResponseSerializer,
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class ScenarioViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "subject"]
    ordering_fields = ["updated_at", "created_at", "title"]
    ordering = ["-updated_at"]

    def get_queryset(self):
        queryset = Scenario.objects.filter(is_deleted=False).select_related("grade", "created_by")
        grade = self.request.query_params.get("grade")
        status_param = self.request.query_params.get("status")
        difficulty = self.request.query_params.get("difficulty")
        subject = self.request.query_params.get("subject")
        tags = self.request.query_params.get("tags")

        if grade:
            queryset = queryset.filter(grade_id=grade)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        if subject:
            queryset = queryset.filter(subject__iexact=subject)
        if tags:
            tag_list = [t.strip() for t in tags.split(",") if t.strip()]
            for tag in tag_list:
                queryset = queryset.filter(tags__contains=tag)

        return queryset

    def get_serializer_class(self):
        if self.action in ["retrieve", "duplicate", "archive", "publish"]:
            return ScenarioDetailSerializer
        return ScenarioSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        scenario = self.get_object()
        
        # Deep copy scenario metadata
        new_scenario = Scenario.objects.get(pk=scenario.pk)
        new_scenario.pk = None
        new_scenario.title = f"{scenario.title} (Copy)"
        new_scenario.status = Scenario.Status.DRAFT
        new_scenario.created_by = request.user
        new_scenario.is_deleted = False
        new_scenario.save()
        
        # Copy learning outcomes
        for outcome in scenario.learning_outcomes.all():
            outcome.pk = None
            outcome.scenario = new_scenario
            outcome.save()

        # Copy activities and nested screens
        for activity in scenario.activities.all():
            old_activity_pk = activity.pk
            skills = list(activity.skills.all())
            
            activity.pk = None
            activity.scenario = new_scenario
            activity.save()
            activity.skills.set(skills)
            
            old_activity = Activity.objects.get(pk=old_activity_pk)
            for screen in old_activity.screens.all():
                screen.pk = None
                screen.activity = activity
                screen.save()

        serializer = ScenarioDetailSerializer(new_scenario)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        scenario = self.get_object()
        scenario.status = Scenario.Status.ARCHIVED
        scenario.save()
        serializer = ScenarioDetailSerializer(scenario)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        scenario = self.get_object()
        scenario.status = Scenario.Status.PUBLISHED
        scenario.save()
        # NOTE: Real packaging and exporting is Phase 7. For now we only flip the status.
        serializer = ScenarioDetailSerializer(scenario)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="activities")
    def activities(self, request, pk=None):
        scenario = self.get_object()
        activities = scenario.activities.all().order_by("display_order")
        serializer = ActivitySerializer(activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        scenario = self.get_object()
        from .services import build_runtime_payload
        payload = build_runtime_payload(scenario, request)
        return Response(payload, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="learning-outcomes")
    def add_learning_outcome(self, request, pk=None):
        scenario = self.get_object()
        text = request.data.get("text")
        if not text:
            return Response({"text": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        outcome = LearningOutcome.objects.create(scenario=scenario, text=text)
        serializer = LearningOutcomeSerializer(outcome)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post", "delete"], url_path="tags")
    def tags(self, request, pk=None):
        scenario = self.get_object()
        tags_payload = request.data.get("tags")
        if not tags_payload:
            return Response({"tags": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        if isinstance(tags_payload, str):
            tags_payload = [tags_payload]
            
        current_tags = list(scenario.tags) if scenario.tags else []
        
        if request.method == "POST":
            for tag in tags_payload:
                if tag not in current_tags:
                    current_tags.append(tag)
            scenario.tags = current_tags
            scenario.save()
            return Response(ScenarioDetailSerializer(scenario).data, status=status.HTTP_200_OK)
            
        elif request.method == "DELETE":
            new_tags = [t for t in current_tags if t not in tags_payload]
            scenario.tags = new_tags
            scenario.save()
            return Response(ScenarioDetailSerializer(scenario).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def validate(self, request, pk=None):
        scenario = self.get_object()
        # Stub validation report for Phase 3 (Real logic is in Phase 5)
        return Response({
            "scenario_id": scenario.id,
            "status": "success",
            "message": "Stub validation successful. Real validation engine is Phase 5.",
            "errors": [],
            "warnings": []
        }, status=status.HTTP_200_OK)


class ActivityViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]
    queryset = Activity.objects.all().prefetch_related("skills", "screens")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ActivityDetailSerializer
        return ActivitySerializer

    def perform_create(self, serializer):
        from django.db.models import Max
        scenario = serializer.validated_data["scenario"]
        max_order = scenario.activities.aggregate(Max('display_order'))['display_order__max'] or 0
        serializer.save(display_order=max_order + 1)

    @action(detail=True, methods=["get"])
    def screens(self, request, pk=None):
        activity = self.get_object()
        screens = activity.screens.all().order_by("display_order")
        serializer = ScreenSerializer(screens, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        activity = self.get_object()
        from .services import build_runtime_payload
        payload = build_runtime_payload(activity.scenario, request)
        act_data = next((a for a in payload["activities"] if a["id"] == activity.id), None)
        if not act_data:
            return Response({"error": "Activity not found in preview payload."}, status=status.HTTP_404_NOT_FOUND)
        return Response(act_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["patch"], url_path="reorder")
    def reorder(self, request):
        ids = request.data.get("ids")
        if not ids or not isinstance(ids, list):
            return Response({"ids": ["List of IDs is required."]}, status=status.HTTP_400_BAD_REQUEST)
            
        activities = Activity.objects.filter(id__in=ids).select_related("scenario")
        if len(activities) != len(ids):
            return Response({"error": "Some Activity IDs do not exist."}, status=status.HTTP_400_BAD_REQUEST)
            
        scenario_ids = {act.scenario_id for act in activities}
        if len(scenario_ids) > 1:
            return Response({"error": "Activities must belong to the same Scenario."}, status=status.HTTP_400_BAD_REQUEST)
            
        parent_id = scenario_ids.pop()
        
        from django.db import transaction
        try:
            with transaction.atomic():
                for i, act_id in enumerate(ids):
                    Activity.objects.filter(id=act_id).update(display_order=-(i+1))
                for i, act_id in enumerate(ids):
                    Activity.objects.filter(id=act_id).update(display_order=(i+1))
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        ordered_activities = Activity.objects.filter(scenario_id=parent_id).order_by("display_order")
        serializer = ActivitySerializer(ordered_activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ScreenViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]
    queryset = Screen.objects.all().select_related("activity")
    serializer_class = ScreenSerializer

    def perform_create(self, serializer):
        from django.db.models import Max
        activity = serializer.validated_data["activity"]
        max_order = activity.screens.aggregate(Max('display_order'))['display_order__max'] or 0
        serializer.save(display_order=max_order + 1)

    @action(detail=False, methods=["patch"], url_path="reorder")
    def reorder(self, request):
        ids = request.data.get("ids")
        if not ids or not isinstance(ids, list):
            return Response({"ids": ["List of IDs is required."]}, status=status.HTTP_400_BAD_REQUEST)
            
        screens = Screen.objects.filter(id__in=ids).select_related("activity")
        if len(screens) != len(ids):
            return Response({"error": "Some Screen IDs do not exist."}, status=status.HTTP_400_BAD_REQUEST)
            
        activity_ids = {scr.activity_id for scr in screens}
        if len(activity_ids) > 1:
            return Response({"error": "Screens must belong to the same Activity."}, status=status.HTTP_400_BAD_REQUEST)
            
        parent_id = activity_ids.pop()
        
        from django.db import transaction
        try:
            with transaction.atomic():
                for i, scr_id in enumerate(ids):
                    Screen.objects.filter(id=scr_id).update(display_order=-(i+1))
                for i, scr_id in enumerate(ids):
                    Screen.objects.filter(id=scr_id).update(display_order=(i+1))
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        ordered_screens = Screen.objects.filter(activity_id=parent_id).order_by("display_order")
        serializer = ScreenSerializer(ordered_screens, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        from django.db.models import Max
        screen = self.get_object()
        
        max_order = screen.activity.screens.aggregate(Max('display_order'))['display_order__max'] or 0
        new_order = max_order + 1
        
        new_screen = Screen.objects.get(pk=screen.pk)
        new_screen.pk = None
        new_screen.title = f"{screen.title} (Copy)"
        new_screen.display_order = new_order
        new_screen.save()
        
        serializer = ScreenSerializer(new_screen)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LearningOutcomeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]
    queryset = LearningOutcome.objects.all()
    serializer_class = LearningOutcomeSerializer
    http_method_names = ["patch", "delete"]


class MediaViewSet(viewsets.ModelViewSet):
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
        tags = self.request.query_params.get("tags")

        if media_type:
            queryset = queryset.filter(media_type=media_type)
        if folder:
            queryset = queryset.filter(folder=folder)
        if tags:
            queryset = queryset.filter(tags__contains=tags)

        return queryset

    def get_serializer_class(self):
        if self.action in ("upload", "replace"):
            return MediaUploadSerializer
        return MediaSerializer

    def create(self, request, *args, **kwargs):
        return Response(
            {"error": "Method POST not allowed on list view. Please use /api/v1/content/media/upload/ for file uploads."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    @action(detail=False, methods=["post"], url_path="upload", parser_classes=[MultiPartParser, FormParser])
    def upload(self, request):
        serializer = MediaUploadSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        
        uploaded_file = serializer.validated_data["file"]
        name = serializer.validated_data.get("name")
        folder = serializer.validated_data.get("folder", "")
        tags = serializer.validated_data.get("tags", [])
        
        from django.core.exceptions import ValidationError
        from .security import validate_file_security, sanitize_and_generate_stored_filename
        
        try:
            media_type = validate_file_security(uploaded_file)
        except ValidationError as e:
            return Response({"error": list(e.messages)[0]}, status=status.HTTP_400_BAD_REQUEST)
            
        original_filename = uploaded_file.name
        stored_filename = sanitize_and_generate_stored_filename(original_filename)
        
        if not name:
            name = original_filename
            
        from django.core.files.storage import default_storage
        from django.utils import timezone
        
        try:
            saved_path = default_storage.save(f"media_library/{stored_filename}", uploaded_file)
        except Exception as e:
            return Response({"error": f"Failed to save file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        media_asset = Media.objects.create(
            name=name,
            file=saved_path,
            media_type=media_type,
            file_size=uploaded_file.size,
            folder=folder,
            tags=tags,
            original_filename=original_filename,
            stored_filename=stored_filename,
            uploaded_by=request.user,
            uploaded_at=timezone.now()
        )
        
        media_asset.url = request.build_absolute_uri(media_asset.file.url) if media_asset.file else ""
        media_asset.save()
        
        return Response(MediaSerializer(media_asset).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="replace", parser_classes=[MultiPartParser, FormParser])
    def replace(self, request, pk=None):
        media = self.get_object()
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"file": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.core.exceptions import ValidationError
        from .security import validate_file_security, sanitize_and_generate_stored_filename
        
        try:
            media_type = validate_file_security(file_obj)
        except ValidationError as e:
            return Response({"error": list(e.messages)[0]}, status=status.HTTP_400_BAD_REQUEST)
            
        old_file_path = media.file.name if media.file else None
        
        from django.core.files.storage import default_storage
        from django.utils import timezone
        
        original_filename = file_obj.name
        stored_filename = sanitize_and_generate_stored_filename(original_filename)
        
        try:
            saved_path = default_storage.save(f"media_library/{stored_filename}", file_obj)
        except Exception as e:
            return Response({"error": f"Failed to save replacement file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        media.file = saved_path
        media.media_type = media_type
        media.file_size = file_obj.size
        media.original_filename = original_filename
        media.stored_filename = stored_filename
        media.uploaded_at = timezone.now()
        media.uploaded_by = request.user
        media.url = request.build_absolute_uri(media.file.url) if media.file else ""
        media.save()
        
        if old_file_path and default_storage.exists(old_file_path):
            try:
                default_storage.delete(old_file_path)
            except:
                pass
                
        return Response(MediaSerializer(media).data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        media = self.get_object()
        force_delete = request.query_params.get("force", "").lower() == "true"
        
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
                
        if usages and not force_delete:
            return Response(
                {
                    "error": f"Media is currently in use by {len(usages)} screens.",
                    "usages": usages
                },
                status=status.HTTP_409_CONFLICT
            )
            
        file_path = media.file.name if media.file else None
        
        response = super().destroy(request, *args, **kwargs)
        
        if file_path:
            from django.core.files.storage import default_storage
            try:
                if default_storage.exists(file_path):
                    default_storage.delete(file_path)
            except:
                pass
                
        return response

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
        total_scenarios = Scenario.objects.filter(is_deleted=False).count()
        draft_scenarios = Scenario.objects.filter(is_deleted=False, status=Scenario.Status.DRAFT).count()
        published_scenarios = Scenario.objects.filter(is_deleted=False, status=Scenario.Status.PUBLISHED).count()
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
        scenarios = Scenario.objects.filter(is_deleted=False).select_related("grade").order_by("-updated_at")[:5]
        serializer = ScenarioSerializer(scenarios, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DashboardRecentActivityAPIView(APIView):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]

    def get(self, request):
        activities = []
        recent_scenarios = Scenario.objects.filter(is_deleted=False).order_by("-updated_at")[:5]
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


class ValidationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]

    @action(detail=False, methods=["post"], url_path=r"(?P<scenario_id>\d+)/run")
    def run_validation(self, request, scenario_id=None):
        return self._run_and_save(request, scenario_id)

    @action(detail=False, methods=["post"], url_path=r"(?P<scenario_id>\d+)/refresh")
    def refresh_validation(self, request, scenario_id=None):
        return self._run_and_save(request, scenario_id)

    @action(detail=False, methods=["get"], url_path=r"(?P<scenario_id>\d+)")
    def get_latest_report(self, request, scenario_id=None):
        return self._get_report(scenario_id)

    @action(detail=False, methods=["get"], url_path=r"report/(?P<scenario_id>\d+)")
    def get_detailed_report(self, request, scenario_id=None):
        return self._get_report(scenario_id)

    def _get_report(self, scenario_id):
        try:
            scenario = Scenario.objects.get(id=scenario_id, is_deleted=False)
        except Scenario.DoesNotExist:
            return Response({"error": "Scenario not found."}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            report = ValidationReport.objects.filter(scenario=scenario).latest("validated_at")
        except ValidationReport.DoesNotExist:
            return Response({"error": "Validation report has never been run for this scenario."}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = ValidationReportSerializer(report)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _run_and_save(self, request, scenario_id):
        try:
            scenario = Scenario.objects.get(id=scenario_id, is_deleted=False)
        except Scenario.DoesNotExist:
            return Response({"error": "Scenario not found."}, status=status.HTTP_404_NOT_FOUND)
            
        from .validation_engine import run_validation_engine
        report_data = run_validation_engine(scenario)
        
        report, created = ValidationReport.objects.get_or_create(scenario=scenario)
        report.results = report_data["results"]
        report.total_checks = report_data["counts"]["total_checks"]
        report.passed = report_data["counts"]["passed"]
        report.warnings = report_data["counts"]["warnings"]
        report.errors = report_data["counts"]["errors"]
        report.status = report_data["status"]
        report.validated_by = request.user
        report.save()
        
        serializer = ValidationReportSerializer(report)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PreviewViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]

    @action(detail=False, methods=["post"], url_path="start")
    def start(self, request):
        scenario_id = request.data.get("scenario_id")
        if not scenario_id:
            return Response({"scenario_id": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            scenario = Scenario.objects.get(id=scenario_id, is_deleted=False)
        except Scenario.DoesNotExist:
            return Response({"error": "Scenario not found."}, status=status.HTTP_404_NOT_FOUND)
            
        from .services import build_runtime_payload
        payload = build_runtime_payload(scenario, request)
        import uuid
        session_id = str(uuid.uuid4())
        return Response({"session_id": session_id, "payload": payload}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="restart")
    def restart(self, request):
        scenario_id = request.data.get("scenario_id")
        if not scenario_id:
            return Response({"scenario_id": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            scenario = Scenario.objects.get(id=scenario_id, is_deleted=False)
        except Scenario.DoesNotExist:
            return Response({"error": "Scenario not found."}, status=status.HTTP_404_NOT_FOUND)
            
        from .services import build_runtime_payload
        payload = build_runtime_payload(scenario, request)
        import uuid
        session_id = str(uuid.uuid4())
        return Response({"session_id": session_id, "payload": payload}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="stop")
    def stop(self, request):
        session_id = request.data.get("session_id")
        if not session_id:
            return Response({"session_id": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "stopped"}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Phase 7: Publish Center
# ---------------------------------------------------------------------------
class PublishViewSet(viewsets.ViewSet):
    """
    POST /api/v1/content/publish/{scenarioId}/   — run the pipeline
    GET  /api/v1/content/publish/{scenarioId}/   — current publish status
    GET  /api/v1/content/publish/history/{scenarioId}/ — full version history
    """
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]

    def _get_scenario(self, scenario_id):
        try:
            return Scenario.objects.get(id=scenario_id, is_deleted=False)
        except Scenario.DoesNotExist:
            return None

    def publish(self, request, scenario_id=None):
        """POST /api/v1/content/publish/{scenarioId}/"""
        scenario = self._get_scenario(scenario_id)
        if not scenario:
            return Response({"error": "Scenario not found."}, status=status.HTTP_404_NOT_FOUND)

        version = request.data.get("version")  # optional
        release_notes = request.data.get("release_notes", "")

        from .services import build_elab_package
        try:
            result = build_elab_package(
                scenario=scenario,
                version=version,
                release_notes=release_notes,
                published_by=request.user,
            )
        except ValueError as exc:
            args = exc.args[0] if exc.args else ()
            if isinstance(args, tuple) and args[0] == "VALIDATION_FAILED":
                report = args[1]
                return Response(
                    {"error": "Scenario failed validation. Fix errors before publishing.", "validation_report": report},
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )
            if isinstance(args, tuple) and args[0] == "DUPLICATE_VERSION":
                return Response(
                    {"error": f"Version '{args[1]}' already exists for this scenario."},
                    status=status.HTTP_409_CONFLICT,
                )
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except RuntimeError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        version_obj = result["version_obj"]
        response_data = {
            "package_id": version_obj.published_package_id,
            "version_id": version_obj.id,
            "version": result["version"],
            "build_number": result["build_number"],
            "size": result["size"],
            "checksum": result["checksum"],
            "elab_filename": result["elab_filename"],
            "download_url": version_obj.download_url,
            "published_at": version_obj.published_at,
        }
        return Response(response_data, status=status.HTTP_201_CREATED)

    def status_view(self, request, scenario_id=None):
        """GET /api/v1/content/publish/{scenarioId}/"""
        scenario = self._get_scenario(scenario_id)
        if not scenario:
            return Response({"error": "Scenario not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            pkg = PublishedPackage.objects.get(scenario=scenario)
        except PublishedPackage.DoesNotExist:
            return Response(
                {"scenario_id": scenario.id, "status": scenario.status, "published_package": None},
                status=status.HTTP_200_OK,
            )

        latest_version = pkg.versions.order_by("-published_at").first()
        return Response(
            {
                "scenario_id": scenario.id,
                "status": scenario.status,
                "published_package": PublishedPackageSerializer(pkg).data,
                "latest_version": PublishVersionSerializer(latest_version).data if latest_version else None,
            },
            status=status.HTTP_200_OK,
        )

    def history(self, request, scenario_id=None):
        """GET /api/v1/content/publish/history/{scenarioId}/"""
        scenario = self._get_scenario(scenario_id)
        if not scenario:
            return Response({"error": "Scenario not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            pkg = PublishedPackage.objects.get(scenario=scenario)
        except PublishedPackage.DoesNotExist:
            return Response({"scenario_id": scenario.id, "versions": []}, status=status.HTTP_200_OK)

        versions = pkg.versions.order_by("-published_at")
        return Response(
            {"scenario_id": scenario.id, "versions": PublishVersionSerializer(versions, many=True).data},
            status=status.HTTP_200_OK,
        )


class PackageViewSet(viewsets.ViewSet):
    """
    GET  /api/v1/content/packages/{packageId}/           — metadata
    GET  /api/v1/content/packages/{packageId}/download/  — stream .elab
    POST /api/v1/content/packages/{packageId}/regenerate/ — re-run pipeline
    """
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]

    def _get_version(self, package_id):
        try:
            return PublishVersion.objects.select_related(
                "published_package__scenario", "published_by"
            ).get(id=package_id)
        except PublishVersion.DoesNotExist:
            return None

    def retrieve(self, request, pk=None):
        """GET /api/v1/content/packages/{packageId}/"""
        version = self._get_version(pk)
        if not version:
            return Response({"error": "Package not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(PublishVersionSerializer(version).data)

    def download(self, request, pk=None):
        """
        GET /api/v1/content/packages/{packageId}/download/

        Deviation from PDF: PDF specifies POST for download.
        We use GET because this is a file retrieval (idempotent, cacheable).
        A GET with correct Content-Disposition is standard REST for file downloads.
        """
        import os
        from django.http import FileResponse

        version = self._get_version(pk)
        if not version:
            return Response({"error": "Package not found."}, status=status.HTTP_404_NOT_FOUND)

        file_path = version.file_path
        if not file_path or not os.path.exists(file_path):
            return Response(
                {
                    "error": "The .elab file is missing on disk. The database record is intact.",
                    "db_path": file_path,
                    "version_id": version.id,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        elab_filename = os.path.basename(file_path)
        response = FileResponse(
            open(file_path, "rb"),
            content_type="application/octet-stream",
        )
        response["Content-Disposition"] = f'attachment; filename="{elab_filename}"'
        response["X-Checksum-SHA256"] = version.checksum or ""
        return response

    def regenerate(self, request, pk=None):
        """
        POST /api/v1/content/packages/{packageId}/regenerate/
        Re-runs the pipeline at the SAME version, bumps build number.
        """
        import os

        version = self._get_version(pk)
        if not version:
            return Response({"error": "Package not found."}, status=status.HTTP_404_NOT_FOUND)

        scenario = version.published_package.scenario
        fixed_version = version.version_number

        from .services import build_elab_package
        try:
            result = build_elab_package(
                scenario=scenario,
                version=fixed_version,
                release_notes=request.data.get("release_notes", ""),
                published_by=request.user,
                force_regenerate=True,
            )
        except ValueError as exc:
            args = exc.args[0] if exc.args else ()
            if isinstance(args, tuple) and args[0] == "VALIDATION_FAILED":
                report = args[1]
                return Response(
                    {"error": "Scenario failed validation.", "validation_report": report},
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except RuntimeError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        new_version_obj = result["version_obj"]
        return Response(
            {
                "message": "Package regenerated successfully.",
                "version_id": new_version_obj.id,
                "version": result["version"],
                "build_number": result["build_number"],
                "checksum": result["checksum"],
                "size": result["size"],
                "download_url": new_version_obj.download_url,
            },
            status=status.HTTP_200_OK,
        )
