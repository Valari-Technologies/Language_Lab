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

    def delete(self, *args, **kwargs):
        from .models import Class, TeacherClass
        classes = list(Class.objects.filter(teacherclass__teacher=self))
        user = self.user
        super().delete(*args, **kwargs)
        if user and user.pk:
            user.delete()
        for c in classes:
            if Class.objects.filter(pk=c.pk).exists():
                Class.objects.filter(pk=c.pk).delete()


class Class(models.Model):
    class_id = models.AutoField(primary_key=True)
    school = models.ForeignKey("super_admin.School", on_delete=models.CASCADE)
    class_name = models.CharField(max_length=100)
    grade = models.ForeignKey("super_admin.Grade", on_delete=models.CASCADE)
    academic_year = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        from .models import Teacher, TeacherClass
        teachers = list(Teacher.objects.filter(teacherclass__class_obj=self))
        super().delete(*args, **kwargs)
        for t in teachers:
            if Teacher.objects.filter(pk=t.pk).exists():
                Teacher.objects.filter(pk=t.pk).delete()
                if t.user and t.user.pk:
                    t.user.delete()

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
