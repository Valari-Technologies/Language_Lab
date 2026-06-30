from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):

    ROLE_CHOICES = (
        ("SUPER_ADMIN", "Super Admin"),
        ("SCHOOL_ADMIN", "School Admin"),
        ("TEACHER", "Teacher"),
        ("STUDENT", "Student"),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="STUDENT"
    )

    phone_number = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )

    full_name = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username