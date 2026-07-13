from django.contrib import admin
from .models import Grade


original_get_app_list = admin.AdminSite.get_app_list


def get_app_list(self, request, app_label=None):
    """
    Override get_app_list to sort the models in the 'super_admin' app.
    """
    app_list = original_get_app_list(self, request, app_label)

    cms_model_order = {
        "Grade": 1,
    }

    for app in app_list:
        if app.get("app_label") == "super_admin":
            app["models"].sort(key=lambda x: cms_model_order.get(x.get("object_name"), 99))

    return app_list



admin.AdminSite.get_app_list = get_app_list



original_index = admin.AdminSite.index

def custom_index(self, request, extra_context=None):
    from accounts.models import User
    from super_admin.models import Grade

    extra_context = extra_context or {}
    extra_context.update({
        'dashboard_stats': {
            'grades': Grade.objects.count(),
            'schools': User.objects.filter(role=User.Role.SCHOOL_ADMIN).count(),
            'teachers': User.objects.filter(role=User.Role.TEACHER).count(),
            'students': User.objects.filter(role=User.Role.STUDENT).count(),
            'publish_contents': 0,
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
