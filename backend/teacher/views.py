from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsTeacherOrAdmin
from accounts.scoping import filter_queryset_by_school
from super_admin.views import CMSBaseViewSet
from .models import Student
from .serializers import StudentSerializer


class StudentViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]
    queryset = Student.objects.select_related("user", "school").all()
    serializer_class = StudentSerializer
    search_fields = ["user__username", "user__email", "user__full_name"]

    def get_queryset(self):
        queryset = filter_queryset_by_school(
            Student.objects.select_related("user", "school").all(),
            self.request.user,
        )
        user = self.request.user
        if user.role == "TEACHER":
            from school_admin.models import Class
            from django.db.models import Q
            import re

            teacher_classes = Class.objects.filter(teacherclass__teacher__user=user).select_related("grade")
            if not teacher_classes.exists():
                return queryset.none()

            def extract_class_section(class_name):
                if not class_name:
                    return ""
                name = class_name.strip().upper()
                if '-' in name:
                    part = name.split('-')[-1].strip()
                    if part and part.isalpha() and len(part) == 1:
                        return part
                if name and name[-1].isalpha():
                    return name[-1]
                return ""

            def normalize_grade(grade_str):
                if not grade_str:
                    return ""
                match = re.search(r"\d+", str(grade_str))
                if match:
                    return match.group(0)
                return str(grade_str).strip().upper()

            q_filter = Q()
            for cls in teacher_classes:
                grade_norm = normalize_grade(cls.grade.grade_name if cls.grade else "")
                section_norm = extract_class_section(cls.class_name).strip().upper()
                ay_norm = (cls.academic_year or "").replace(" ", "").upper()

                class_q = Q()
                if grade_norm:
                    class_q &= (
                        Q(grade__icontains=grade_norm) |
                        Q(grade__icontains=f"Grade {grade_norm}") |
                        Q(grade__icontains=f"Class {grade_norm}")
                    )
                if section_norm:
                    class_q &= (
                        Q(section__iexact=section_norm) |
                        Q(section__icontains=f"Section {section_norm}")
                    )
                if ay_norm:
                    ay_with_spaces = f"{ay_norm[:4]} - {ay_norm[5:]}" if len(ay_norm) == 9 and ay_norm[4] == '-' else ay_norm
                    class_q &= (
                        Q(academic_year__iexact=ay_norm) |
                        Q(academic_year__iexact=ay_with_spaces) |
                        Q(academic_year__isnull=True) |
                        Q(academic_year="")
                    )
                q_filter |= class_q

            queryset = queryset.filter(q_filter)
        return queryset

    def perform_destroy(self, instance):
        user = instance.user
        super().perform_destroy(instance)
        if user:
            user.delete()
