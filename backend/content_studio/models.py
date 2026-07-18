from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Experience(models.Model):
    class Difficulty(models.TextChoices):
        EASY = "EASY", _("Easy")
        MEDIUM = "MEDIUM", _("Medium")
        HARD = "HARD", _("Hard")

    class Status(models.TextChoices):
        DRAFT = "DRAFT", _("Draft")
        PUBLISHED = "PUBLISHED", _("Published")
        ARCHIVED = "ARCHIVED", _("Archived")

    title = models.CharField(
        max_length=200,
        verbose_name=_("Title"),
        help_text=_("The title of the studio experience.")
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description"),
        help_text=_("Detailed experience description.")
    )
    grade = models.ForeignKey(
        "super_admin.Grade",
        on_delete=models.CASCADE,
        related_name="studio_experiences",
        verbose_name=_("Grade"),
        help_text=_("The grade this experience targets.")
    )
    subject = models.CharField(
        max_length=100,
        verbose_name=_("Subject"),
        help_text=_("The subject, e.g. English, Grammar.")
    )
    language = models.CharField(
        max_length=100,
        verbose_name=_("Language"),
        help_text=_("Target instruction language.")
    )
    difficulty = models.CharField(
        max_length=20,
        choices=Difficulty.choices,
        default=Difficulty.MEDIUM,
        verbose_name=_("Difficulty")
    )
    estimated_duration = models.IntegerField(
        verbose_name=_("Estimated Duration"),
        help_text=_("Duration of the experience in minutes.")
    )
    thumbnail = models.URLField(
        blank=True,
        null=True,
        max_length=255,
        verbose_name=_("Thumbnail URL")
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name=_("Status")
    )
    tags = models.JSONField(
        default=list,
        blank=True,
        verbose_name=_("Tags")
    )
    is_deleted = models.BooleanField(
        default=False,
        null=True,
        blank=True,
        verbose_name=_("Is Deleted")
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_studio_experiences",
        verbose_name=_("Created By")
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
        verbose_name = _("Studio Experience")
        verbose_name_plural = _("Studio Experiences")
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} ({self.grade.grade_name})"


class LearningOutcome(models.Model):
    experience = models.ForeignKey(
        Experience,
        on_delete=models.CASCADE,
        related_name="learning_outcomes",
        verbose_name=_("Experience")
    )
    text = models.TextField(
        verbose_name=_("Outcome Text")
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
        verbose_name = _("Learning Outcome")
        verbose_name_plural = _("Learning Outcomes")
        ordering = ["id"]

    def __str__(self):
        return f"Outcome for {self.experience.title}: {self.text[:50]}"


class ActivitySkill(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_("Skill Name")
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description")
    )

    class Meta:
        verbose_name = _("Activity Skill")
        verbose_name_plural = _("Activity Skills")
        ordering = ["name"]

    def __str__(self):
        return self.name


class Activity(models.Model):
    experience = models.ForeignKey(
        Experience,
        on_delete=models.CASCADE,
        related_name="activities",
        verbose_name=_("Experience")
    )
    title = models.CharField(
        max_length=200,
        verbose_name=_("Title")
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description")
    )
    learning_objective = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Learning Objective")
    )
    skills = models.ManyToManyField(
        ActivitySkill,
        related_name="activities",
        blank=True,
        verbose_name=_("Skills")
    )
    estimated_duration = models.IntegerField(
        verbose_name=_("Estimated Duration"),
        help_text=_("Duration in minutes.")
    )
    mastery_threshold = models.IntegerField(
        default=80,
        verbose_name=_("Mastery Threshold"),
        help_text=_("Percentage threshold for completion, e.g. 80.")
    )
    display_order = models.IntegerField(
        verbose_name=_("Display Order")
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
        verbose_name = _("Activity")
        verbose_name_plural = _("Activities")
        ordering = ["display_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["experience", "display_order"],
                name="unique_activity_display_order_per_experience"
            )
        ]

    def __str__(self):
        return f"{self.title} (Order: {self.display_order})"


class Screen(models.Model):
    class ScreenType(models.TextChoices):
        INFORMATION = "INFORMATION", _("Information")
        IMAGE = "IMAGE", _("Image")
        VIDEO = "VIDEO", _("Video")
        QUIZ = "QUIZ", _("Quiz")
        SPEAKING = "SPEAKING", _("Speaking")
        WRITING = "WRITING", _("Writing")

    class ScreenStatus(models.TextChoices):
        NOT_STARTED = "NOT_STARTED", _("Not Started")
        IN_PROGRESS = "IN_PROGRESS", _("In Progress")
        COMPLETE = "COMPLETE", _("Complete")

    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name="screens",
        verbose_name=_("Activity")
    )
    title = models.CharField(
        max_length=200,
        verbose_name=_("Title")
    )
    screen_type = models.CharField(
        max_length=30,
        choices=ScreenType.choices,
        default=ScreenType.INFORMATION,
        verbose_name=_("Screen Type")
    )
    status = models.CharField(
        max_length=30,
        choices=ScreenStatus.choices,
        default=ScreenStatus.NOT_STARTED,
        verbose_name=_("Screen Status")
    )
    display_order = models.IntegerField(
        verbose_name=_("Display Order")
    )
    content = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_("Flexible Content JSON")
    )
    estimated_duration = models.IntegerField(
        verbose_name=_("Estimated Duration Seconds"),
        help_text=_("Duration in seconds.")
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
        verbose_name = _("Screen")
        verbose_name_plural = _("Screens")
        ordering = ["display_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["activity", "display_order"],
                name="unique_screen_display_order_per_activity"
            )
        ]

    def __str__(self):
        return f"{self.title} (Order: {self.display_order}, Type: {self.screen_type})"


class Media(models.Model):
    class MediaType(models.TextChoices):
        IMAGE = "IMAGE", _("Image")
        AUDIO = "AUDIO", _("Audio")
        VIDEO = "VIDEO", _("Video")
        DOCUMENT = "DOCUMENT", _("Document")

    name = models.CharField(
        max_length=255,
        verbose_name=_("Media Name")
    )
    file = models.FileField(
        upload_to="media_library/",
        blank=True,
        null=True,
        verbose_name=_("File Field")
    )
    url = models.URLField(
        blank=True,
        null=True,
        max_length=255,
        verbose_name=_("External URL")
    )
    media_type = models.CharField(
        max_length=30,
        choices=MediaType.choices,
        verbose_name=_("Media Type")
    )
    file_size = models.IntegerField(
        blank=True,
        null=True,
        verbose_name=_("File Size (Bytes)")
    )
    folder = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Folder Name")
    )
    tags = models.JSONField(
        default=list,
        blank=True,
        verbose_name=_("Tags")
    )
    original_filename = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Original Filename")
    )
    stored_filename = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Stored Filename")
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_studio_media",
        verbose_name=_("Uploaded By")
    )
    upload_date = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Upload Date")
    )
    uploaded_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("Uploaded At")
    )

    class Meta:
        verbose_name = _("Media Asset")
        verbose_name_plural = _("Media Assets")
        ordering = ["-upload_date"]

    def __str__(self):
        return f"{self.name} ({self.media_type})"


class ValidationReport(models.Model):
    experience = models.ForeignKey(
        Experience,
        on_delete=models.CASCADE,
        related_name="validation_reports",
        verbose_name=_("Experience")
    )
    results = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_("Validation Results JSON")
    )
    total_checks = models.IntegerField(
        default=0,
        verbose_name=_("Total Checks")
    )
    passed = models.IntegerField(
        default=0,
        verbose_name=_("Passed Checks")
    )
    warnings = models.IntegerField(
        default=0,
        verbose_name=_("Warnings Count")
    )
    errors = models.IntegerField(
        default=0,
        verbose_name=_("Errors Count")
    )
    status = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("Status")
    )
    validated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="validation_reports",
        verbose_name=_("Validated By")
    )
    validated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Validated At")
    )

    class Meta:
        verbose_name = _("Validation Report")
        verbose_name_plural = _("Validation Reports")
        ordering = ["-validated_at"]

    def __str__(self):
        return f"Validation Report for {self.experience.title} at {self.validated_at}"


class PublishedPackage(models.Model):
    experience = models.OneToOneField(
        Experience,
        on_delete=models.CASCADE,
        related_name="published_package",
        verbose_name=_("Experience")
    )
    package_name = models.CharField(
        max_length=255,
        verbose_name=_("Package Name")
    )
    output_format = models.CharField(
        max_length=20,
        default=".elab",
        verbose_name=_("Output Format")
    )
    compression_status = models.CharField(
        max_length=50,
        verbose_name=_("Compression Status")
    )
    include_analytics = models.BooleanField(
        default=True,
        verbose_name=_("Include Analytics")
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
        verbose_name = _("Published Package")
        verbose_name_plural = _("Published Packages")
        ordering = ["-updated_at"]

    def __str__(self):
        return self.package_name


class PublishVersion(models.Model):
    published_package = models.ForeignKey(
        PublishedPackage,
        on_delete=models.CASCADE,
        related_name="versions",
        verbose_name=_("Published Package")
    )
    version_number = models.CharField(
        max_length=50,
        verbose_name=_("Version Number")
    )
    build_number = models.IntegerField(
        verbose_name=_("Build Number")
    )
    release_notes = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Release Notes")
    )
    package_size = models.IntegerField(
        verbose_name=_("Package Size (Bytes)")
    )
    download_url = models.URLField(
        blank=True,
        null=True,
        verbose_name=_("Download URL")
    )
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="published_studio_versions",
        verbose_name=_("Published By")
    )
    published_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Published At")
    )
    # Phase 7: added for real packaging
    file_path = models.CharField(
        max_length=512,
        blank=True,
        null=True,
        verbose_name=_("Package File Path"),
        help_text=_("Absolute path to the .elab file on disk.")
    )
    checksum = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        verbose_name=_("SHA-256 Checksum"),
        help_text=_("SHA-256 hash of the .elab file.")
    )

    class Meta:
        verbose_name = _("Publish Version")
        verbose_name_plural = _("Publish Versions")
        ordering = ["-published_at"]

    def __str__(self):
        return f"{self.published_package.package_name} - {self.version_number} (Build: {self.build_number})"


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        INFO = "INFO", _("Info")
        WARNING = "WARNING", _("Warning")
        ERROR = "ERROR", _("Error")

    title = models.CharField(
        max_length=255,
        verbose_name=_("Title")
    )
    message = models.TextField(
        verbose_name=_("Message")
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.INFO,
        verbose_name=_("Notification Type")
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="studio_notifications",
        verbose_name=_("User")
    )
    is_read = models.BooleanField(
        default=False,
        verbose_name=_("Is Read")
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Created At")
    )

    class Meta:
        verbose_name = _("Studio Notification")
        verbose_name_plural = _("Studio Notifications")
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
