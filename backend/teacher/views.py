from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsSuperAdminOrSchoolAdminWrite
from accounts.scoping import filter_queryset_by_school
from super_admin.views import CMSBaseViewSet
from .models import Student
from .serializers import StudentSerializer


class StudentViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdminOrSchoolAdminWrite]
    queryset = Student.objects.select_related("user", "school").all()
    serializer_class = StudentSerializer
    search_fields = ["user__username", "user__email", "user__full_name"]

    def get_queryset(self):
        return filter_queryset_by_school(
            Student.objects.select_related("user", "school").all(),
            self.request.user,
        )

    def perform_destroy(self, instance):
        user = instance.user
        super().perform_destroy(instance)
        if user:
            user.delete()
