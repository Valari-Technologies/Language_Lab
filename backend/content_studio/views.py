from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser

from accounts.permissions import IsContentCreatorOrSuperAdmin, IsSuperAdmin, IsContentCreator
from .models import (
    Experience,
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
    ExperienceSerializer,
    ExperienceDetailSerializer,
    ActivitySerializer,
    ActivityDetailSerializer,
    ActivitySkillSerializer,
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


class ExperienceViewSet(viewsets.ModelViewSet):
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.action in ("retrieve", "activities"):
            from accounts.permissions import IsContentCreatorOrSuperAdminOrSchoolUser
            return [IsAuthenticated(), IsContentCreatorOrSuperAdminOrSchoolUser()]
        if self.action in ("destroy", "preview"):
            return [IsAuthenticated(), IsContentCreatorOrSuperAdmin()]
        return [IsAuthenticated(), IsContentCreator()]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "subject"]
    ordering_fields = ["updated_at", "created_at", "title"]
    ordering = ["-updated_at"]

    def get_queryset(self):
        queryset = Experience.objects.filter(is_deleted=False).select_related("grade", "created_by")

        # Filter for school tenants (only show published experiences)
        role = getattr(self.request.user, "role", None)
        if role in ["SCHOOL_ADMIN", "TEACHER", "STUDENT"]:
            queryset = queryset.filter(status="APPROVED")
        

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
            return ExperienceDetailSerializer
        return ExperienceSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        experience = self.get_object()
        
        # Deep copy experience metadata
        new_experience = Experience.objects.get(pk=experience.pk)
        new_experience.pk = None
        new_experience.title = f"{experience.title} (Copy)"
        new_experience.status = Experience.Status.DRAFT
        new_experience.created_by = request.user
        new_experience.is_deleted = False
        new_experience.save()
        
        # Copy learning outcomes
        for outcome in experience.learning_outcomes.all():
            outcome.pk = None
            outcome.experience = new_experience
            outcome.save()

        # Copy activities and nested screens
        for activity in experience.activities.all():
            old_activity_pk = activity.pk
            skills = list(activity.skills.all())
            
            activity.pk = None
            activity.experience = new_experience
            activity.save()
            activity.skills.set(skills)
            
            old_activity = Activity.objects.get(pk=old_activity_pk)
            for screen in old_activity.screens.all():
                screen.pk = None
                screen.activity = activity
                screen.save()

        serializer = ExperienceDetailSerializer(new_experience)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        experience = self.get_object()
        experience.status = Experience.Status.REJECTED
        experience.save()
        serializer = ExperienceDetailSerializer(experience)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        experience = self.get_object()
        experience.status = Experience.Status.PENDING_APPROVAL
        experience.save()
        serializer = ExperienceDetailSerializer(experience)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="activities")
    def activities(self, request, pk=None):
        experience = self.get_object()
        activities = experience.activities.all().order_by("display_order")
        serializer = ActivitySerializer(activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        experience = self.get_object()
        from content_studio.services.preview_service import get_experience_preview_payload
        payload = get_experience_preview_payload(experience, request)
        return Response(payload, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="learning-outcomes")
    def add_learning_outcome(self, request, pk=None):
        experience = self.get_object()
        text = request.data.get("text")
        if not text:
            return Response({"text": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        outcome = LearningOutcome.objects.create(experience=experience, text=text)
        serializer = LearningOutcomeSerializer(outcome)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post", "delete"], url_path="tags")
    def tags(self, request, pk=None):
        experience = self.get_object()
        tags_payload = request.data.get("tags")
        if not tags_payload:
            return Response({"tags": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        if isinstance(tags_payload, str):
            tags_payload = [tags_payload]
            
        current_tags = list(experience.tags) if experience.tags else []
        
        if request.method == "POST":
            for tag in tags_payload:
                if tag not in current_tags:
                    current_tags.append(tag)
            experience.tags = current_tags
            experience.save()
            return Response(ExperienceDetailSerializer(experience).data, status=status.HTTP_200_OK)
            
        elif request.method == "DELETE":
            new_tags = [t for t in current_tags if t not in tags_payload]
            experience.tags = new_tags
            experience.save()
            return Response(ExperienceDetailSerializer(experience).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def validate(self, request, pk=None):
        experience = self.get_object()
        # Stub validation report for Phase 3 (Real logic is in Phase 5)
        return Response({
            "experience_id": experience.id,
            "status": "success",
            "message": "Stub validation successful. Real validation engine is Phase 5.",
            "errors": [],
            "warnings": []
        }, status=status.HTTP_200_OK)


class ActivitySkillViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = ActivitySkill.objects.all().order_by("name")
    serializer_class = ActivitySkillSerializer
    pagination_class = None


class ActivityViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]
    queryset = Activity.objects.all().prefetch_related("skills", "screens")

    def get_serializer_class(self):
        if self.action in ["retrieve", "create", "update", "partial_update"]:
            return ActivityDetailSerializer
        return ActivitySerializer

    def perform_create(self, serializer):
        from django.db.models import Max
        experience = serializer.validated_data["experience"]
        max_order = experience.activities.aggregate(Max('display_order'))['display_order__max'] or 0
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
        from content_studio.services.preview_service import get_experience_preview_payload
        payload = get_experience_preview_payload(activity.experience, request)
        act_data = next((a for a in payload["activities"] if a["id"] == activity.id), None)
        if not act_data:
            return Response({"error": "Activity not found in preview payload."}, status=status.HTTP_404_NOT_FOUND)
        return Response(act_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["patch"], url_path="reorder")
    def reorder(self, request):
        ids = request.data.get("ids")
        if not ids or not isinstance(ids, list):
            return Response({"ids": ["List of IDs is required."]}, status=status.HTTP_400_BAD_REQUEST)
            
        activities = Activity.objects.filter(id__in=ids).select_related("experience")
        if len(activities) != len(ids):
            return Response({"error": "Some Activity IDs do not exist."}, status=status.HTTP_400_BAD_REQUEST)
            
        experience_ids = {act.experience_id for act in activities}
        if len(experience_ids) > 1:
            return Response({"error": "Activities must belong to the same Experience."}, status=status.HTTP_400_BAD_REQUEST)
            
        parent_id = experience_ids.pop()
        
        from django.db import transaction
        try:
            with transaction.atomic():
                for i, act_id in enumerate(ids):
                    Activity.objects.filter(id=act_id).update(display_order=-(i+1))
                for i, act_id in enumerate(ids):
                    Activity.objects.filter(id=act_id).update(display_order=(i+1))
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        ordered_activities = Activity.objects.filter(experience_id=parent_id).order_by("display_order")
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
    # Allow full CRUD: list/retrieve (GET), create (POST), update (PATCH), destroy (DELETE)
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]


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
        
        all_screens = Screen.objects.filter(activity__experience__is_deleted=False).select_related("activity__experience")
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
                    "experience_id": scr.activity.experience.id,
                    "experience_title": scr.activity.experience.title,
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
        all_screens = Screen.objects.filter(activity__experience__is_deleted=False).select_related("activity__experience")
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
                    "experience_id": scr.activity.experience.id,
                    "experience_title": scr.activity.experience.title,
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
        total_experiences = Experience.objects.filter(is_deleted=False).count()
        draft_experiences = Experience.objects.filter(is_deleted=False, status=Experience.Status.DRAFT).count()
        published_experiences = Experience.objects.filter(is_deleted=False, status=Experience.Status.APPROVED).count()
        total_media_assets = Media.objects.count()

        return Response({
            "total_experiences": total_experiences,
            "draft_experiences": draft_experiences,
            "published_experiences": published_experiences,
            "total_media_assets": total_media_assets
        }, status=status.HTTP_200_OK)


class DashboardRecentExperiencesAPIView(APIView):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]

    def get(self, request):
        experiences = Experience.objects.filter(is_deleted=False).select_related("grade").order_by("-updated_at")[:5]
        serializer = ExperienceSerializer(experiences, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DashboardRecentActivityAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = getattr(user, "role", "STUDENT")
        activities = []

        from django.utils import timezone
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(days=7)

        if role in ["SUPER_ADMIN", "CONTENT_CREATOR"]:
            recent_experiences = Experience.objects.filter(is_deleted=False, updated_at__gte=cutoff).order_by("-updated_at")[:15]
            for s in recent_experiences:
                activities.append({
                    "id": f"experience-{s.id}",
                    "activity_type": "experience_edited",
                    "message": f"Experience '{s.title}' was updated.",
                    "timestamp": s.updated_at
                })

            recent_media = Media.objects.filter(upload_date__gte=cutoff).order_by("-upload_date")[:15]
            for m in recent_media:
                activities.append({
                    "id": f"media-{m.id}",
                    "activity_type": "media_uploaded",
                    "message": f"Media asset '{m.name}' was uploaded.",
                    "timestamp": m.upload_date
                })

        elif role == "SCHOOL_ADMIN":
            from school_admin.models import Teacher, Class
            from teacher.models import Student
            
            school = None
            if hasattr(user, "school_admin_profile"):
                school = user.school_admin_profile.school
            
            if school:
                recent_teachers = Teacher.objects.filter(school=school, created_at__gte=cutoff).order_by("-created_at")[:10]
                for t in recent_teachers:
                    activities.append({
                        "id": f"teacher-{t.teacher_id}",
                        "activity_type": "teacher_registered",
                        "message": f"Teacher '{t.user.full_name or t.user.username}' was registered.",
                        "timestamp": t.created_at
                    })
                
                recent_classes = Class.objects.filter(school=school, created_at__gte=cutoff).order_by("-created_at")[:10]
                for c in recent_classes:
                    activities.append({
                        "id": f"class-{c.class_id}",
                        "activity_type": "class_created",
                        "message": f"Class '{c.class_name}' was created.",
                        "timestamp": c.created_at
                    })

                recent_students = Student.objects.filter(school=school, created_at__gte=cutoff).order_by("-created_at")[:10]
                for st in recent_students:
                    activities.append({
                        "id": f"student-{st.student_id}",
                        "activity_type": "student_registered",
                        "message": f"Student '{st.user.full_name or st.user.username}' enrolled.",
                        "timestamp": st.created_at
                    })
            
        elif role == "TEACHER":
            from school_admin.models import Teacher
            from teacher.models import Student
            
            teacher = Teacher.objects.filter(user=user).first()
            if teacher:
                recent_students = Student.objects.filter(school=teacher.school, created_at__gte=cutoff).order_by("-created_at")[:15]
                for st in recent_students:
                    activities.append({
                        "id": f"student-{st.student_id}",
                        "activity_type": "student_enrolled",
                        "message": f"Student '{st.user.full_name or st.user.username}' was enrolled in school.",
                        "timestamp": st.created_at
                    })

        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        recent_activities = activities[:50]

        for act in recent_activities:
            if hasattr(act["timestamp"], "isoformat"):
                act["timestamp"] = act["timestamp"].isoformat()
            else:
                act["timestamp"] = str(act["timestamp"])

        return Response(recent_activities, status=status.HTTP_200_OK)


class DashboardNotificationsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by("-created_at")[:15]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "success"}, status=status.HTTP_200_OK)

    def delete(self, request):
        notif_id = request.query_params.get("id")
        if notif_id:
            Notification.objects.filter(user=request.user, id=notif_id).delete()
        else:
            Notification.objects.filter(user=request.user).delete()
        return Response({"status": "success"}, status=status.HTTP_200_OK)



class ValidationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]

    @action(detail=False, methods=["post"], url_path=r"(?P<experience_id>\d+)/run")
    def run_validation(self, request, experience_id=None):
        return self._run_and_save(request, experience_id)

    @action(detail=False, methods=["post"], url_path=r"(?P<experience_id>\d+)/refresh")
    def refresh_validation(self, request, experience_id=None):
        return self._run_and_save(request, experience_id)

    @action(detail=False, methods=["get"], url_path=r"(?P<experience_id>\d+)")
    def get_latest_report(self, request, experience_id=None):
        return self._get_report(experience_id)

    @action(detail=False, methods=["get"], url_path=r"report/(?P<experience_id>\d+)")
    def get_detailed_report(self, request, experience_id=None):
        return self._get_report(experience_id)

    def _get_report(self, experience_id):
        try:
            experience = Experience.objects.get(id=experience_id, is_deleted=False)
        except Experience.DoesNotExist:
            return Response({"error": "Experience not found."}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            report = ValidationReport.objects.filter(experience=experience).latest("validated_at")
        except ValidationReport.DoesNotExist:
            return Response({"error": "Validation report has never been run for this experience."}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = ValidationReportSerializer(report)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _run_and_save(self, request, experience_id):
        try:
            experience = Experience.objects.get(id=experience_id, is_deleted=False)
        except Experience.DoesNotExist:
            return Response({"error": "Experience not found."}, status=status.HTTP_404_NOT_FOUND)
            
        from .validation_engine import run_validation_engine
        report_data = run_validation_engine(experience)
        
        report, created = ValidationReport.objects.get_or_create(experience=experience)
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
        experience_id = request.data.get("experience_id")
        if not experience_id:
            return Response({"experience_id": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            experience = Experience.objects.get(id=experience_id, is_deleted=False)
        except Experience.DoesNotExist:
            return Response({"error": "Experience not found."}, status=status.HTTP_404_NOT_FOUND)
            
        from content_studio.services.preview_service import get_experience_preview_payload
        payload = get_experience_preview_payload(experience, request)
        import uuid
        session_id = str(uuid.uuid4())
        return Response({"session_id": session_id, "payload": payload}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="restart")
    def restart(self, request):
        experience_id = request.data.get("experience_id")
        if not experience_id:
            return Response({"experience_id": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            experience = Experience.objects.get(id=experience_id, is_deleted=False)
        except Experience.DoesNotExist:
            return Response({"error": "Experience not found."}, status=status.HTTP_404_NOT_FOUND)
            
        from content_studio.services.preview_service import get_experience_preview_payload
        payload = get_experience_preview_payload(experience, request)
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
    POST /api/v1/content/publish/{experienceId}/   — run the pipeline
    GET  /api/v1/content/publish/{experienceId}/   — current publish status
    GET  /api/v1/content/publish/history/{experienceId}/ — full version history
    """
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]

    def _get_experience(self, experience_id):
        try:
            return Experience.objects.get(id=experience_id, is_deleted=False)
        except Experience.DoesNotExist:
            return None

    def publish(self, request, experience_id=None):
        """POST /api/v1/content/publish/{experienceId}/"""
        experience = self._get_experience(experience_id)
        if not experience:
            return Response({"error": "Experience not found."}, status=status.HTTP_404_NOT_FOUND)

        version = request.data.get("version")  # optional
        release_notes = request.data.get("release_notes", "")

        from content_studio.validation_engine import run_validation_engine
        report_data = run_validation_engine(experience)
        if report_data["status"] == "FAILED":
            return Response(
                {"error": "Experience failed validation. Fix errors before publishing.", "validation_report": report_data},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        # Duplicate version check
        if version:
            try:
                package = PublishedPackage.objects.get(experience=experience)
                if PublishVersion.objects.filter(published_package=package, version_number=version).exists():
                    return Response(
                        {"error": f"Version '{version}' already exists for this experience."},
                        status=status.HTTP_409_CONFLICT,
                    )
            except PublishedPackage.DoesNotExist:
                pass

        experience.status = "PENDING_APPROVAL"
        experience.pending_version = version or "1.0"
        experience.pending_release_notes = release_notes
        experience.save(update_fields=["status", "pending_version", "pending_release_notes"])

        return Response(
            {
                "message": "Experience submitted to Super Admin for approval.",
                "status": experience.status,
                "pending_version": experience.pending_version,
                "pending_release_notes": experience.pending_release_notes
            },
            status=status.HTTP_200_OK
        )

    def status_view(self, request, experience_id=None):
        """GET /api/v1/content/publish/{experienceId}/"""
        experience = self._get_experience(experience_id)
        if not experience:
            return Response({"error": "Experience not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            pkg = PublishedPackage.objects.get(experience=experience)
        except PublishedPackage.DoesNotExist:
            return Response(
                {"experience_id": experience.id, "status": experience.status, "published_package": None},
                status=status.HTTP_200_OK,
            )

        latest_version = pkg.versions.order_by("-published_at").first()
        return Response(
            {
                "experience_id": experience.id,
                "status": experience.status,
                "published_package": PublishedPackageSerializer(pkg).data,
                "latest_version": PublishVersionSerializer(latest_version).data if latest_version else None,
            },
            status=status.HTTP_200_OK,
        )

    def history(self, request, experience_id=None):
        """GET /api/v1/content/publish/history/{experienceId}/"""
        experience = self._get_experience(experience_id)
        if not experience:
            return Response({"error": "Experience not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            pkg = PublishedPackage.objects.get(experience=experience)
        except PublishedPackage.DoesNotExist:
            return Response({"experience_id": experience.id, "versions": []}, status=status.HTTP_200_OK)

        versions = pkg.versions.order_by("-published_at")
        return Response(
            {"experience_id": experience.id, "versions": PublishVersionSerializer(versions, many=True).data},
            status=status.HTTP_200_OK,
        )


class PackageViewSet(viewsets.ViewSet):
    """
    GET  /api/v1/content/packages/{packageId}/           — metadata
    GET  /api/v1/content/packages/{packageId}/download/  — stream .elab
    POST /api/v1/content/packages/{packageId}/regenerate/ — re-run pipeline
    """
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]

    def get_permissions(self):
        if self.action in ["download"]:
            from accounts.permissions import IsAuthenticatedOrLMSClient
            return [IsAuthenticatedOrLMSClient()]
        return super().get_permissions()

    def _get_version(self, package_id):
        try:
            return PublishVersion.objects.select_related(
                "published_package__experience", "published_by"
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

        if version.published_package.experience.status != "APPROVED":
            return Response({"error": "Only approved experience packages can be downloaded."}, status=status.HTTP_403_FORBIDDEN)

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
        zip_filename = elab_filename.replace('.elab', '.zip') if elab_filename.endswith('.elab') else f"{elab_filename}.zip"
        response = FileResponse(
            open(file_path, "rb"),
            content_type="application/zip",
        )
        response["Content-Disposition"] = f'attachment; filename="{zip_filename}"'
        response["X-Checksum-SHA256"] = version.checksum or ""
        return response

    def preview_json(self, request, pk=None):
        """
        GET /api/v1/content/packages/{packageId}/preview-json/

        Opens the .elab zip archive and returns its contents (experience.json,
        manifest.json, metadata.json) merged into a single JSON response.
        Designed for content creator testing and inspection.
        """
        import os
        import zipfile
        import json

        version = self._get_version(pk)
        if not version:
            return Response({"error": "Package not found."}, status=status.HTTP_404_NOT_FOUND)

        file_path = version.file_path
        if not file_path or not os.path.exists(file_path):
            return Response(
                {
                    "error": "The .elab file is missing on disk.",
                    "db_path": file_path,
                    "version_id": version.id,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            result = {
                "package_meta": PublishVersionSerializer(version).data,
                "files_in_archive": [],
                "experience": None,
                "manifest": None,
                "metadata": None,
            }

            with zipfile.ZipFile(file_path, "r") as zf:
                result["files_in_archive"] = zf.namelist()
                for member in zf.namelist():
                    try:
                        data = json.loads(zf.read(member).decode("utf-8"))
                    except (UnicodeDecodeError, json.JSONDecodeError):
                        # Binary file – skip
                        continue
                    if "experience.json" in member:
                        result["experience"] = data
                    elif "manifest.json" in member:
                        result["manifest"] = data
                    elif "metadata.json" in member:
                        result["metadata"] = data

            return Response(result, status=status.HTTP_200_OK)

        except zipfile.BadZipFile:
            return Response(
                {"error": "The .elab file on disk is corrupted or not a valid ZIP archive."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as exc:
            return Response(
                {"error": f"Failed to read package: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def regenerate(self, request, pk=None):
        """
        POST /api/v1/content/packages/{packageId}/regenerate/
        Re-runs the pipeline at the SAME version, bumps build number.
        """
        import os

        version = self._get_version(pk)
        if not version:
            return Response({"error": "Package not found."}, status=status.HTTP_404_NOT_FOUND)

        experience = version.published_package.experience
        fixed_version = version.version_number

        from content_studio.publish.publish_service import build_elab_package
        try:
            result = build_elab_package(
                experience=experience,
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
                    {"error": "Experience failed validation.", "validation_report": report},
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


class AIGenerateView(APIView):
    """
    POST /api/v1/cms/ai-generate/
    AI Content Assistant utilizing Google Gemini API (gemini-1.5-flash) to auto-generate structured screen content.
    """
    permission_classes = [IsAuthenticated, IsContentCreatorOrSuperAdmin]

    def post(self, request):
        topic = request.data.get("topic")
        target_level = request.data.get("target_level")
        content_type = request.data.get("content_type")

        if not topic or not target_level or not content_type:
            return Response(
                {"error": "Missing required fields: topic, target_level, and content_type are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        allowed_types = [
            "quiz", "dialogue", "fill_in_blanks", "full_screen", "remedial",
            "dictation", "sequence_audio", "quiz_listening",
            "roleplay", "pronunciation", "reading_passage", "match",
            "flashcards", "wordsearch", "fill_blank",
            "writing_prompt", "sentence_builder", "grammar_correction",
            "true_false", "drag_drop"
        ]
        if content_type not in allowed_types:
            return Response(
                {"error": f"Invalid content_type. Allowed choices are: {', '.join(allowed_types)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        from .services.ai_service import generate_ai_content
        try:
            result = generate_ai_content(topic, target_level, content_type)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as ve:
            return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"AI generation failed: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)


class SuperAdminExperienceViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def list(self, request):
        """GET /api/v1/super-admin/experiences/"""
        status_param = request.query_params.get("status")
        grade_param = request.query_params.get("grade")
        queryset = Experience.objects.filter(is_deleted=False).select_related("grade", "created_by")
        if status_param:
            queryset = queryset.filter(status=status_param)
        else:
            # By default or if none, list experiences that are not draft
            queryset = queryset.exclude(status="DRAFT")
        if grade_param:
            queryset = queryset.filter(grade_id=grade_param)

        # Serializer
        serializer = ExperienceSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """POST /api/v1/super-admin/experiences/{id}/approve/"""
        try:
            experience = Experience.objects.get(id=pk, is_deleted=False)
        except Experience.DoesNotExist:
            return Response({"error": "Experience not found."}, status=status.HTTP_404_NOT_FOUND)

        # Generate the final .elab package zip file
        from content_studio.publish.publish_service import build_elab_package
        try:
            result = build_elab_package(
                experience=experience,
                version=experience.pending_version or "1.0",
                release_notes=experience.pending_release_notes or "",
                published_by=request.user,
            )
        except ValueError as exc:
            args = exc.args[0] if exc.args else ()
            if isinstance(args, tuple) and args[0] == "VALIDATION_FAILED":
                report = args[1]
                return Response(
                    {"error": "Experience failed validation. Fix errors before approving.", "validation_report": report},
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )
            if isinstance(args, tuple) and args[0] == "DUPLICATE_VERSION":
                return Response(
                    {"error": f"Version '{args[1]}' already exists for this experience."},
                    status=status.HTTP_409_CONFLICT,
                )
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except RuntimeError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Clear pending metadata
        experience.pending_version = None
        experience.pending_release_notes = None
        experience.review_remark = None
        experience.save(update_fields=["pending_version", "pending_release_notes", "review_remark"])

        version_obj = result["version_obj"]
        response_data = {
            "message": "Experience approved and package generated successfully.",
            "package_id": version_obj.published_package_id,
            "version_id": version_obj.id,
            "version": result["version"],
            "build_number": result["build_number"],
            "size": result["size"],
            "checksum": result["checksum"],
            "elab_filename": result["elab_filename"],
            "download_url": version_obj.download_url,
            "published_at": version_obj.published_at,
            "status": "APPROVED",
        }
        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """POST /api/v1/super-admin/experiences/{id}/reject/"""
        try:
            experience = Experience.objects.get(id=pk, is_deleted=False)
        except Experience.DoesNotExist:
            return Response({"error": "Experience not found."}, status=status.HTTP_404_NOT_FOUND)

        remark = request.data.get("review_remark", "")
        experience.status = "REJECTED"
        experience.review_remark = remark
        experience.pending_version = None
        experience.pending_release_notes = None
        experience.save(update_fields=["status", "review_remark", "pending_version", "pending_release_notes"])

        return Response(
            {
                "message": "Experience rejected successfully.",
                "status": experience.status,
                "review_remark": remark,
            },
            status=status.HTTP_200_OK
        )

