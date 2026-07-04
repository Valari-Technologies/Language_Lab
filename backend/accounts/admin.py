from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Admin panel configuration for Custom User Model.
    Includes the custom role and full_name fields in lists and forms.
    """
    list_display = (
        "username",
        "email",
        "role",
        "is_staff",
        "is_active",
    )

    list_filter = (
        "role",
        "is_staff",
        "is_active",
    )

    search_fields = (
        "username",
        "email",
    )

    ordering = (
        "username",
    )

    fieldsets = UserAdmin.fieldsets + (
        ("Custom Role Fields", {"fields": ("role", "full_name")}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Custom Role Fields", {"fields": ("role", "full_name")}),
    )