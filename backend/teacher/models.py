from django.db import models
from django.conf import settings


class Student(models.Model):
    student_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    school = models.ForeignKey("super_admin.School", on_delete=models.CASCADE)
    roll_no = models.CharField(max_length=50, blank=True, null=True)
    grade = models.CharField(max_length=50, blank=True, null=True)
    section = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cms_student"

    def __str__(self):
        return f"{self.user.username} - {self.school.school_name}"
