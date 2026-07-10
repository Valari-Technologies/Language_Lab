from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings


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
        db_table = "cms_grade"

    def __str__(self):
        return self.grade_name


class School(models.Model):
    school_id = models.AutoField(primary_key=True)
    school_name = models.CharField(max_length=150)
    address = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.CharField(max_length=100)
    logo = models.CharField(max_length=255, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cms_school"

    def __str__(self):
        return self.school_name


class PublishContent(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", _("Draft")
        PUBLISHED = "PUBLISHED", _("Published")
        ARCHIVED = "ARCHIVED", _("Archived")

    publish_id = models.AutoField(primary_key=True, verbose_name=_("Publish ID"))
    release_name = models.CharField(
        max_length=100,
        verbose_name=_("Release Name"),
        help_text=_("e.g., 'Grade 6 - July Release'")
    )
    grade = models.ForeignKey(
        Grade,
        on_delete=models.CASCADE,
        related_name="publish_contents",
        verbose_name=_("Grade"),
        db_column="grade_id"
    )
    total_scenarios = models.IntegerField(
        verbose_name=_("Total Scenarios"),
        help_text=_("Number of scenarios included")
    )
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="published_contents",
        verbose_name=_("Published By"),
        db_column="published_by"
    )
    published_at = models.DateTimeField(
        verbose_name=_("Published At"),
        help_text=_("Publish date and time"),
        null=True,
        blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name=_("Status")
    )
    export_file = models.CharField(
        max_length=255,
        verbose_name=_("Export File"),
        help_text=_("Path to generated export package (ZIP/JSON)"),
        null=True,
        blank=True
    )
    checksum = models.CharField(
        max_length=64,
        verbose_name=_("Checksum"),
        help_text=_("Integrity verification hash"),
        null=True,
        blank=True
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
        verbose_name = _("Publish Content")
        verbose_name_plural = _("Publish Contents")
        ordering = ["-created_at"]
        db_table = "cms_publishcontent"

    def __str__(self):
        return f"{self.release_name} - {self.status}"


class SchoolAdminProfile(models.Model):
    profile_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="school_admin_profile",
    )
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cms_schooladminprofile"

    def __str__(self):
        return f"{self.user.username} - {self.school.school_name}"
