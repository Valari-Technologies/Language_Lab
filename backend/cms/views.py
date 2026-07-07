from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.views import APIView

from .models import Grade, Scenario, ScenarioBuilder, PublishContent
from .serializers import (
    GradeSerializer,
    GradeDetailSerializer,
    ScenarioSerializer,
    ScenarioDetailSerializer,
    ScenarioBuilderSerializer,
    PublishContentSerializer,
    PublishContentDetailSerializer,
)


class IsSuperAdmin(BasePermission):
 
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (getattr(request.user, "role", None) == "SUPER_ADMIN" or request.user.is_superuser)
        )


class CMSBaseViewSet(viewsets.ModelViewSet):
  
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    filter_backends = [SearchFilter, OrderingFilter]

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
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
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
  
    queryset = Grade.objects.all()
    search_fields = ["grade_name", "description"]
    ordering_fields = ["sort_order", "grade_name", "created_at"]
    ordering = ["sort_order"]

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return GradeDetailSerializer
        return GradeSerializer



class ScenarioViewSet(CMSBaseViewSet):
 
    search_fields = ["title", "description", "objective"]
    ordering_fields = ["estimated_duration", "created_at", "title"]
    ordering = ["grade", "-created_at"]

    def get_queryset(self):
        queryset = Scenario.objects.all()
        grade = self.request.query_params.get("grade")
        difficulty = self.request.query_params.get("difficulty")
        status = self.request.query_params.get("status")

        if grade:
            queryset = queryset.filter(grade_id=grade)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        if status:
            queryset = queryset.filter(status=status)

        return queryset

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return ScenarioDetailSerializer
        return ScenarioSerializer


class ScenarioBuilderViewSet(CMSBaseViewSet):
   
    serializer_class = ScenarioBuilderSerializer
    search_fields = ["title", "content"]
    ordering_fields = ["display_order", "created_at"]
    ordering = ["display_order"]

    def get_queryset(self):
        queryset = ScenarioBuilder.objects.all()
        experience = self.request.query_params.get("experience")
        block_type = self.request.query_params.get("block_type")

        if experience:
            queryset = queryset.filter(experience_id=experience)
        if block_type:
            queryset = queryset.filter(block_type=block_type)

        return queryset


class PublishContentViewSet(CMSBaseViewSet):
    queryset = PublishContent.objects.all()
    search_fields = ["release_name", "checksum", "export_file"]
    ordering_fields = ["created_at", "release_name", "published_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return PublishContentDetailSerializer
        return PublishContentSerializer

    def perform_create(self, serializer):
        from django.utils import timezone
        serializer.save(published_by=self.request.user, published_at=timezone.now())



class DashboardStatsAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.contrib.auth import get_user_model
        from .models import School, PublishContent
        User = get_user_model()
        return Response({
            "total_schools": School.objects.count(),
            "total_school_admins": User.objects.filter(role="SCHOOL_ADMIN").count(),
            "total_publish_contents": PublishContent.objects.count(),
            "total_grades": Grade.objects.count(),
            "total_scenarios": Scenario.objects.count(),
            "draft_scenarios": Scenario.objects.filter(status=Scenario.Status.DRAFT).count(),
            "published_scenarios": Scenario.objects.filter(status=Scenario.Status.PUBLISHED).count(),
            "recent_scenarios": [
                {
                    "id": s.id,
                    "title": s.title,
                    "grade": s.grade.grade_name if s.grade else "N/A",
                    "status": s.status,
                    "updated_at": s.updated_at.strftime("%b %d, %Y")
                } for s in Scenario.objects.order_by('-updated_at')[:3]
            ]
        }, status=status.HTTP_200_OK)



from django.contrib.auth import get_user_model
from rest_framework import serializers
from accounts.permissions import IsAdminRole
from .models import School, Teacher, Class, TeacherClass
from .serializers import SchoolSerializer, TeacherSerializer, ClassSerializer, TeacherClassSerializer

User = get_user_model()

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role', 'is_active', 'password']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}
    
    def create(self, validated_data):
        validated_data['role'] = User.Role.STUDENT
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

class SchoolViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsAdminRole]
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    search_fields = ["school_name"]

class TeacherViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsAdminRole]
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    search_fields = ["user__username", "qualification"]

class ClassViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsAdminRole]
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    search_fields = ["class_name"]

class TeacherClassViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsAdminRole]
    queryset = TeacherClass.objects.all()
    serializer_class = TeacherClassSerializer

class StudentViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsAdminRole]
    queryset = User.objects.filter(role="STUDENT")
    serializer_class = StudentSerializer
    search_fields = ["username", "email", "full_name"]
