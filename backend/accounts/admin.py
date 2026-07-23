from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, PasswordResetOTP


@admin.register(User)
class CustomUserAdmin(UserAdmin):
# ... custom user admin definition ...
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


@admin.register(PasswordResetOTP)
class PasswordResetOTPAdmin(admin.ModelAdmin):
    list_display = ("email", "otp_code", "created_at", "expires_at", "is_verified")
    list_filter = ("is_verified", "created_at")
    search_fields = ("email", "otp_code")