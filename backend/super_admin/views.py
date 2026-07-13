from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.views import APIView

from accounts.permissions import IsSuperAdmin, IsSuperAdminOrReadOnlyStaff
from accounts.scoping import filter_queryset_by_school
from .models import Grade, School, SchoolAdminProfile
from .serializers import (
    GradeDetailSerializer,
    GradeSerializer,
    SchoolAdminSerializer,
    SchoolSerializer,
)

User = get_user_model()


class CMSBaseViewSet(viewsets.ModelViewSet):
    filter_backends = [SearchFilter, OrderingFilter]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def get_model_name(self):
        model = getattr(self, "model", None)
        if not model:
            queryset = getattr(self, "queryset", None)
            if queryset is not None:
                model = queryset.model
            else:
                model = self.get_queryset().model
        return model._meta.verbose_name.title() if model else "Object"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                "message": f"{self.get_model_name()} created successfully",
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, "_prefetched_objects_cache", None):
            instance._prefetched_objects_cache = {}

        return Response(
            {
                "message": f"{self.get_model_name()} updated successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": f"{self.get_model_name()} deleted successfully"},
            status=status.HTTP_200_OK
        )


class GradeViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdminOrReadOnlyStaff]
    queryset = Grade.objects.all()
    search_fields = ["grade_name", "description"]
    ordering_fields = ["sort_order", "grade_name", "created_at"]
    ordering = ["sort_order"]

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return GradeDetailSerializer
        return GradeSerializer


class SchoolViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdminOrReadOnlyStaff]
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    search_fields = ["school_name"]

    def get_queryset(self):
        return filter_queryset_by_school(School.objects.all(), self.request.user, school_field="school_id")


class DashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        return Response({
            "total_schools": School.objects.count(),
            "total_school_admins": User.objects.filter(role="SCHOOL_ADMIN").count(),
            "total_publish_contents": 0,
            "total_grades": Grade.objects.count(),
            "total_scenarios": 0,
            "draft_scenarios": 0,
            "published_scenarios": 0,
            "recent_scenarios": []
        }, status=status.HTTP_200_OK)


class SchoolAdminViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    queryset = User.objects.filter(role="SCHOOL_ADMIN").select_related("school_admin_profile__school")
    serializer_class = SchoolAdminSerializer
    search_fields = ["username", "email", "full_name"]

    def get_queryset(self):
        return User.objects.filter(role="SCHOOL_ADMIN").select_related("school_admin_profile__school")

    def perform_destroy(self, instance):
        SchoolAdminProfile.objects.filter(user=instance).delete()
        super().perform_destroy(instance)
