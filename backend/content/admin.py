from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Scenario, ScenarioBuilder


original_get_app_list = admin.AdminSite.get_app_list


def get_app_list(self, request, app_label=None):
    """
    Override get_app_list to sort the models in the 'content' app
    according to the logical hierarchical flow: Scenario -> Scenario Builder.
    """
    app_list = original_get_app_list(self, request, app_label)

    content_model_order = {
        "Scenario": 1,
        "ScenarioBuilder": 2,
    }

    for app in app_list:
        if app.get("app_label") == "content":
            app["models"].sort(key=lambda x: content_model_order.get(x.get("object_name"), 99))

    return app_list


admin.AdminSite.get_app_list = get_app_list


class ScenarioBuilderInline(admin.TabularInline):
    model = ScenarioBuilder
    extra = 1
    sortable_field_name = "display_order"
    fields = ("block_type", "title", "content", "media_url", "display_order", "settings")
    classes = ("collapse",)


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
