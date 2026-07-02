from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Grade, LearningExperience, ExperienceStep, Assessment, Question, Option


original_get_app_list = admin.AdminSite.get_app_list


def get_app_list(self, request, app_label=None):
    """
    Override get_app_list to sort the models in the 'cms' app
    according to the logical hierarchical flow:
    Grade -> Learning Experience -> Experience Step -> Assessment -> Question -> Option
    """
    app_list = original_get_app_list(self, request, app_label)
    
    cms_model_order = {
        "Grade": 1,
        "LearningExperience": 2,
        "ExperienceStep": 3,
        "Assessment": 4,
        "Question": 5,
        "Option": 6,
    }
    
    for app in app_list:
        if app.get("app_label") == "cms":
            app["models"].sort(key=lambda x: cms_model_order.get(x.get("object_name"), 99))
            
    return app_list



admin.AdminSite.get_app_list = get_app_list



class ExperienceStepInline(admin.TabularInline):
    model = ExperienceStep
    extra = 1
    sortable_field_name = "display_order"
    fields = ("block_type", "title", "content", "media_url", "display_order", "settings")
    classes = ("collapse",)


class AssessmentInline(admin.TabularInline):
    model = Assessment
    extra = 1
    sortable_field_name = "display_order"
    fields = ("title", "instructions", "mastery", "total_marks", "display_order")
    classes = ("collapse",)


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    sortable_field_name = "display_order"
    fields = ("question_type", "question_text", "marks", "display_order")
    classes = ("collapse",)


class OptionInline(admin.TabularInline):
    model = Option
    extra = 2
    sortable_field_name = "display_order"
    fields = ("option_text", "is_correct", "display_order")


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ("grade_name", "sort_order", "created_at", "updated_at")
    search_fields = ("grade_name", "description")
    ordering = ("sort_order", "grade_name")
    readonly_fields = ("created_at", "updated_at")


@admin.register(LearningExperience)
class LearningExperienceAdmin(admin.ModelAdmin):
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
    inlines = [ExperienceStepInline, AssessmentInline]
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


@admin.register(ExperienceStep)
class ExperienceStepAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "experience",
        "block_type",
        "display_order",
        "created_at",
        "updated_at",
    )
    list_filter = ("block_type", "experience__grade", "experience")
    search_fields = ("title", "content", "experience__title")
    ordering = ("experience", "display_order")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "experience",
        "mastery",
        "total_marks",
        "display_order",
        "created_at",
        "updated_at",
    )
    list_filter = ("experience__grade", "experience")
    search_fields = ("title", "instructions", "experience__title")
    ordering = ("experience", "display_order")
    readonly_fields = ("created_at", "updated_at")
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = (
        "question_text_short",
        "assessment",
        "question_type",
        "marks",
        "display_order",
        "created_at",
    )
    list_filter = ("question_type", "assessment__experience__grade", "assessment")
    search_fields = ("question_text", "assessment__title")
    ordering = ("assessment", "display_order")
    readonly_fields = ("created_at", "updated_at")
    inlines = [OptionInline]

    @admin.display(description=_("Question Text"))
    def question_text_short(self, obj):
        if obj.question_text and len(obj.question_text) > 75:
            return f"{obj.question_text[:75]}..."
        return obj.question_text or ""


@admin.register(Option)
class OptionAdmin(admin.ModelAdmin):
    list_display = (
        "option_text_short",
        "question",
        "is_correct",
        "display_order",
        "created_at",
    )
    list_filter = ("is_correct", "question__assessment")
    search_fields = ("option_text", "question__question_text")
    ordering = ("question", "display_order")
    readonly_fields = ("created_at", "updated_at")

    @admin.display(description=_("Option Text"))
    def option_text_short(self, obj):
        if obj.option_text and len(obj.option_text) > 50:
            return f"{obj.option_text[:50]}..."
        return obj.option_text or ""
