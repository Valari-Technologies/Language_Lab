from django.db import models
from django.utils.translation import gettext_lazy as _


class Grade(models.Model):
   
    grade_name = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_("Grade Name"),
        help_text=_("Unique name identifying the grade level (up to 50 characters).")
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description"),
        help_text=_("A detailed description of the grade requirements or standards.")
    )
    sort_order = models.IntegerField(
        verbose_name=_("Sort Order"),
        help_text=_("Defines the sequence in which grades are listed.")
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
        verbose_name = _("Grade")
        verbose_name_plural = _("Grades")
        ordering = ["sort_order", "grade_name"]

    def __str__(self):
        return self.grade_name


class LearningExperience(models.Model):
    
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
        Grade,
        on_delete=models.CASCADE,
        related_name="learning_experiences",
        verbose_name=_("Grade"),
        help_text=_("The grade/level this learning experience belongs to.")
    )
    title = models.CharField(
        max_length=200,
        verbose_name=_("Title"),
        help_text=_("The title of the learning experience.")
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description"),
        help_text=_("Detailed information about the learning experience.")
    )
    objective = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Objective"),
        help_text=_("Pedagogical goals of this learning experience.")
    )
    estimated_duration = models.IntegerField(
        verbose_name=_("Estimated Duration"),
        help_text=_("Estimated time to complete the experience (in minutes).")
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
        help_text=_("Lifecycle state of the learning experience.")
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
        verbose_name = _("Learning Experience")
        verbose_name_plural = _("Learning Experiences")
        ordering = ["grade", "-created_at"]

    def __str__(self):
        return f"{self.title} ({self.grade.grade_name})"


class ExperienceStep(models.Model):
    
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

    experience = models.ForeignKey(
        LearningExperience,
        on_delete=models.CASCADE,
        related_name="steps",
        verbose_name=_("Learning Experience"),
        help_text=_("The learning experience this step belongs to.")
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
        help_text=_("Sequence in which this step is displayed within the experience.")
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
        verbose_name = _("Experience Step")
        verbose_name_plural = _("Experience Steps")
        ordering = ["display_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["experience", "display_order"],
                name="unique_step_display_order_per_experience"
            )
        ]

    def __str__(self):
        return f"{self.experience.title} - Step {self.display_order}: {self.title}"


class Assessment(models.Model):
    
    experience = models.ForeignKey(
        LearningExperience,
        on_delete=models.CASCADE,
        related_name="assessments",
        verbose_name=_("Learning Experience"),
        help_text=_("The learning experience this assessment evaluates.")
    )
    title = models.CharField(
        max_length=200,
        verbose_name=_("Title"),
        help_text=_("Title of the assessment.")
    )
    instructions = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Instructions"),
        help_text=_("Instructions or guidelines for students before starting.")
    )
    mastery = models.IntegerField(
        blank=True,
        null=True,
        verbose_name=_("Mastery"),
        help_text=_("Minimum marks required to pass the assessment.")
    )
    total_marks = models.IntegerField(
        verbose_name=_("Total Marks"),
        help_text=_("Total achievable marks for the assessment.")
    )
    display_order = models.IntegerField(
        verbose_name=_("Display Order"),
        help_text=_("Sequence in which this assessment is listed.")
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
        verbose_name = _("Assessment")
        verbose_name_plural = _("Assessments")
        ordering = ["display_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["experience", "display_order"],
                name="unique_assessment_display_order_per_experience"
            )
        ]

    def __str__(self):
        return f"{self.title} (Exp: {self.experience.title})"


class Question(models.Model):
 
    class QuestionType(models.TextChoices):
        MCQ = "MCQ", _("Multiple Choice Question")
        TRUE_FALSE = "TRUE_FALSE", _("True or False")
        MATCH = "MATCH", _("Match Column")
        FILL_BLANK = "FILL_BLANK", _("Fill in the Blank")
        SHORT_ANSWER = "SHORT_ANSWER", _("Short Answer")

    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name="questions",
        verbose_name=_("Assessment"),
        help_text=_("The assessment this question belongs to.")
    )
    question_type = models.CharField(
        max_length=30,
        choices=QuestionType.choices,
        verbose_name=_("Question Type"),
        help_text=_("The type/format of the question.")
    )
    question_text = models.TextField(
        verbose_name=_("Question Text"),
        help_text=_("The text/prompt of the question itself.")
    )
    marks = models.IntegerField(
        verbose_name=_("Marks"),
        help_text=_("Marks allocated for answering this question correctly.")
    )
    display_order = models.IntegerField(
        verbose_name=_("Display Order"),
        help_text=_("Sequence of the question within the assessment.")
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
        verbose_name = _("Question")
        verbose_name_plural = _("Questions")
        ordering = ["display_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["assessment", "display_order"],
                name="unique_question_display_order_per_assessment"
            )
        ]

    def __str__(self):
        return f"Q{self.display_order} ({self.question_type}) - {self.assessment.title}"


class Option(models.Model):
   
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="options",
        verbose_name=_("Question"),
        help_text=_("The question this option belongs to.")
    )
    option_text = models.TextField(
        verbose_name=_("Option Text"),
        help_text=_("The text content of the option.")
    )
    is_correct = models.BooleanField(
        default=False,
        verbose_name=_("Is Correct"),
        help_text=_("Designates whether this is the correct answer.")
    )
    display_order = models.IntegerField(
        verbose_name=_("Display Order"),
        help_text=_("Sequence of the option relative to other options in the question.")
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
        verbose_name = _("Option")
        verbose_name_plural = _("Options")
        ordering = ["display_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["question", "display_order"],
                name="unique_option_display_order_per_question"
            )
        ]

    def __str__(self):
        return f"{self.option_text[:50]} ({'Correct' if self.is_correct else 'Incorrect'})"
