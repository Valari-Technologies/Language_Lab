from django.db import models
from django.conf import settings


class Teacher(models.Model):
    teacher_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    school = models.ForeignKey("super_admin.School", on_delete=models.CASCADE)
    qualification = models.CharField(max_length=150, null=True, blank=True)
    experience_years = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cms_teacher"

    def __str__(self):
        return f"{self.user.username} - {self.school.school_name}"


class Class(models.Model):
    class_id = models.AutoField(primary_key=True)
    school = models.ForeignKey("super_admin.School", on_delete=models.CASCADE)
    class_name = models.CharField(max_length=100)
    grade = models.ForeignKey("super_admin.Grade", on_delete=models.CASCADE)
    academic_year = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cms_class"

    def __str__(self):
        return f"{self.class_name} ({self.academic_year})"


class TeacherClass(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE)

    class Meta:
        db_table = "cms_teacherclass"
        constraints = [
            models.UniqueConstraint(fields=["teacher", "class_obj"], name="unique_teacher_class")
        ]
