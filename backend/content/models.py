from django.db import models
from django.utils.translation import gettext_lazy as _


class Scenario(models.Model):

    class Difficulty(models.TextChoices):
        EASY = "EASY", _("Easy")
        MEDIUM = "MEDIUM", _("Medium")
        HARD = "HARD", _("Hard")

    class Status(models.TextChoices):
        DRAFT = "DRAFT", _("Draft")
        REVIEW = "REVIEW", _("Review")
        TESTING = "TESTING", _("Testing")
        PUBLISHED = "PUBLISHED", _("Published")

    grade = models.ForeignKey(
        "super_admin.Grade",
        on_delete=models.CASCADE,
        related_name="scenarios",
        verbose_name=_("Grade"),
        help_text=_("The grade/level this scenario belongs to.")
    )
    title = models.CharField(
        max_length=200,
        verbose_name=_("Title"),
        help_text=_("The title of the scenario.")
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description"),
        help_text=_("Detailed information about the scenario.")
    )
    objective = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Objective"),
        help_text=_("Pedagogical goals of this scenario.")
    )
    estimated_duration = models.IntegerField(
        verbose_name=_("Estimated Duration"),
        help_text=_("Estimated time to complete the scenario (in minutes).")
    )
    difficulty = models.CharField(
        max_length=20,
        choices=Difficulty.choices,
        default=Difficulty.MEDIUM,
        verbose_name=_("Difficulty"),
        help_text=_("Complexity rating of the learning material.")
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name=_("Status"),
        help_text=_("Lifecycle state of the scenario.")
    )
    thumbnail = models.URLField(
        blank=True,
        null=True,
        max_length=255,
        verbose_name=_("Thumbnail URL"),
        help_text=_("URL link to the cover/thumbnail image.")
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Created At")
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Updated At")
    )

    class Meta:
        verbose_name = _("Scenario")
        verbose_name_plural = _("Scenarios")
        ordering = ["grade", "-created_at"]
        db_table = "cms_scenario"

    def __str__(self):
        return f"{self.title} ({self.grade.grade_name})"


class ScenarioBuilder(models.Model):

    class BlockType(models.TextChoices):
        VIDEO = "VIDEO", _("Video")
        STORY = "STORY", _("Story")
        AUDIO = "AUDIO", _("Audio")
        VOCABULARY = "VOCABULARY", _("Vocabulary")
        GRAMMAR_GAME = "GRAMMAR_GAME", _("Grammar Game")
        SPEAKING = "SPEAKING", _("Speaking")
        WRITING = "WRITING", _("Writing")
        MCQ = "MCQ", _("Multiple Choice Question")
        SUMMARY = "SUMMARY", _("Summary")

    scenario = models.ForeignKey(
        Scenario,
        on_delete=models.CASCADE,
        related_name="scenario_builders",
        verbose_name=_("Scenario"),
        help_text=_("The scenario this step belongs to.")
    )
    block_type = models.CharField(
        max_length=30,
        choices=BlockType.choices,
        verbose_name=_("Block Type"),
        help_text=_("The type of content or activity block.")
    )
    title = models.CharField(
        max_length=200,
        verbose_name=_("Title"),
        help_text=_("Title of this step.")
    )
    content = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Content"),
        help_text=_("The body content, story text, or instruction.")
    )
    media_url = models.URLField(
        blank=True,
        null=True,
        max_length=255,
        verbose_name=_("Media URL"),
        help_text=_("URL link to external video, audio, or image media.")
    )
    display_order = models.IntegerField(
        verbose_name=_("Display Order"),
        help_text=_("Sequence in which this step is displayed within the scenario.")
    )
    settings = models.JSONField(
        blank=True,
        null=True,
        verbose_name=_("Settings"),
        help_text=_("Dynamic configuration settings for the block (JSON).")
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Created At")
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Updated At")
    )

    class Meta:
        verbose_name = _("Scenario Builder")
        verbose_name_plural = _("Scenario Builders")
        ordering = ["display_order"]
        db_table = "cms_scenariobuilder"
        constraints = [
            models.UniqueConstraint(
                fields=["scenario", "display_order"],
                name="unique_step_display_order_per_scenario"
            )
        ]

    def __str__(self):
        return f"{self.scenario.title} - Step {self.display_order}: {self.title}"
