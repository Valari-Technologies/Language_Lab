from django.contrib import admin
from .models import Grade, PublishContent


original_get_app_list = admin.AdminSite.get_app_list


def get_app_list(self, request, app_label=None):
    """
    Override get_app_list to sort the models in the 'super_admin' app
    according to the logical hierarchical flow: Grade -> Publish Content.
    """
    app_list = original_get_app_list(self, request, app_label)

    cms_model_order = {
        "Grade": 1,
        "PublishContent": 7,
    }

    for app in app_list:
        if app.get("app_label") == "super_admin":
            app["models"].sort(key=lambda x: cms_model_order.get(x.get("object_name"), 99))

    return app_list



admin.AdminSite.get_app_list = get_app_list



original_index = admin.AdminSite.index

def custom_index(self, request, extra_context=None):
    from accounts.models import User
    from super_admin.models import Grade, PublishContent

    extra_context = extra_context or {}
    extra_context.update({
        'dashboard_stats': {
            'grades': Grade.objects.count(),
            'schools': User.objects.filter(role=User.Role.SCHOOL_ADMIN).count(),
            'teachers': User.objects.filter(role=User.Role.TEACHER).count(),
            'students': User.objects.filter(role=User.Role.STUDENT).count(),
            'publish_contents': PublishContent.objects.count(),
        }
    })
    return original_index(self, request, extra_context=extra_context)

admin.AdminSite.index = custom_index


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ("grade_name", "sort_order", "created_at", "updated_at")
    search_fields = ("grade_name", "description")
    ordering = ("sort_order", "grade_name")
    readonly_fields = ("created_at", "updated_at")


@admin.register(PublishContent)
class PublishContentAdmin(admin.ModelAdmin):
    list_display = (
        "publish_id",
        "release_name",
        "grade",
        "total_scenarios",
        "published_by",
        "published_at",
        "status",
        "export_file",
        "created_at",
    )
    list_filter = ("status", "grade", "published_by")
    search_fields = ("release_name", "checksum", "export_file")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")
