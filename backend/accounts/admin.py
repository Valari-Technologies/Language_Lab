from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):

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