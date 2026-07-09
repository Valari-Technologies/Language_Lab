from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Grade, Scenario, ScenarioBuilder, PublishContent


original_get_app_list = admin.AdminSite.get_app_list


def get_app_list(self, request, app_label=None):
    """
    Override get_app_list to sort the models in the 'super_admin' app
    according to the logical hierarchical flow:
    Grade -> Scenario -> Scenario Builder -> Assessment -> Question -> Option
    """
    app_list = original_get_app_list(self, request, app_label)

    cms_model_order = {
        "Grade": 1,
        "Scenario": 2,
        "ScenarioBuilder": 3,

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


class ScenarioBuilderInline(admin.TabularInline):
    model = ScenarioBuilder
    extra = 1
    sortable_field_name = "display_order"
    fields = ("block_type", "title", "content", "media_url", "display_order", "settings")
    classes = ("collapse",)


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ("grade_name", "sort_order", "created_at", "updated_at")
    search_fields = ("grade_name", "description")
    ordering = ("sort_order", "grade_name")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Scenario)
class ScenarioAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "grade",
        "difficulty",
        "status",
        "estimated_duration",
        "created_at",
        "updated_at",
    )
    list_filter = ("grade", "difficulty", "status")
    search_fields = ("title", "description", "objective")
    ordering = ("grade", "-created_at")
    readonly_fields = ("created_at", "updated_at")
    inlines = [ScenarioBuilderInline]
    fieldsets = (
        (None, {
            "fields": ("grade", "title", "description", "objective")
        }),
        (_("Details"), {
            "fields": ("estimated_duration", "difficulty", "status", "thumbnail")
        }),
        (_("Timestamps"), {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(ScenarioBuilder)
class ScenarioBuilderAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "scenario",
        "block_type",
        "display_order",
        "created_at",
        "updated_at",
    )
    list_filter = ("block_type", "scenario__grade", "scenario")
    search_fields = ("title", "content", "scenario__title")
    ordering = ("scenario", "display_order")
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
