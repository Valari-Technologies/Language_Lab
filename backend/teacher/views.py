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
            teacher_classes = Class.objects.filter(teacherclass__teacher__user=user).select_related("grade")
            
            if not teacher_classes.exists():
                return queryset.none()
                
            matching_ids = []
            
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

            import re
            def normalize_grade(grade_str):
                if not grade_str:
                    return ""
                match = re.search(r"\d+", str(grade_str))
                if match:
                    return match.group(0)
                return str(grade_str).strip().upper()

            def normalize_section(sec_str):
                if not sec_str:
                    return ""
                sec = str(sec_str).strip().upper()
                if sec.startswith("SECTION "):
                    sec = sec[8:].strip()
                if len(sec) > 1 and sec[-1].isalpha():
                    return sec[-1]
                return sec

            assigned_lookup = set()
            for cls in teacher_classes:
                grade_norm = normalize_grade(cls.grade.grade_name if cls.grade else "")
                section_norm = normalize_section(extract_class_section(cls.class_name))
                ay_norm = (cls.academic_year or "").replace(" ", "").upper()
                assigned_lookup.add((grade_norm, section_norm, ay_norm))

            for student in queryset:
                s_grade = normalize_grade(student.grade)
                s_section = normalize_section(student.section)
                s_ay = (student.academic_year or "").replace(" ", "").upper()
                
                if (s_grade, s_section, s_ay) in assigned_lookup:
                    matching_ids.append(student.student_id)
            
            queryset = queryset.filter(student_id__in=matching_ids)
            
        return queryset

    def perform_destroy(self, instance):
        user = instance.user
        super().perform_destroy(instance)
        if user:
            user.delete()
