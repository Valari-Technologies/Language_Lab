from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsSuperAdminOrSchoolAdminWrite
from core.scoping import filter_queryset_by_school, get_user_school
from super_admin.views import CMSBaseViewSet
from .models import Class, Teacher, TeacherClass
from .serializers import ClassSerializer, TeacherClassSerializer, TeacherSerializer


class TeacherViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdminOrSchoolAdminWrite]
    queryset = Teacher.objects.select_related("user", "school").all()
    serializer_class = TeacherSerializer
    search_fields = ["user__username", "qualification"]

    def get_queryset(self):
        return filter_queryset_by_school(
            Teacher.objects.select_related("user", "school").all(),
            self.request.user,
        )


class ClassViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdminOrSchoolAdminWrite]
    queryset = Class.objects.select_related("school", "grade").all()
    serializer_class = ClassSerializer
    search_fields = ["class_name"]

    def get_queryset(self):
        return filter_queryset_by_school(
            Class.objects.select_related("school", "grade").all(),
            self.request.user,
        )


class TeacherClassViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdminOrSchoolAdminWrite]
    queryset = TeacherClass.objects.select_related("teacher", "class_obj").all()
    serializer_class = TeacherClassSerializer

    def get_queryset(self):
        school = get_user_school(self.request.user)
        queryset = TeacherClass.objects.select_related("teacher", "class_obj").all()
        if school is None:
            if self.request.user.role == "SUPER_ADMIN" or self.request.user.is_superuser:
                return queryset
            return queryset.none()
        return queryset.filter(class_obj__school=school)
