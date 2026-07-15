from django.db import models
from django.conf import settings


class ScenarioAssignment(models.Model):
    school = models.ForeignKey(
        "super_admin.School",
        on_delete=models.CASCADE,
        related_name="scenario_assignments"
    )
    scenario_ref = models.CharField(max_length=255)
    scenario_title = models.CharField(max_length=255)
    grade = models.ForeignKey(
        "super_admin.Grade",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="scenario_assignments"
    )
    class_obj = models.ForeignKey(
        "school_admin.Class",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="scenario_assignments"
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_scenarios"
    )
    assigned_at = models.DateTimeField()
    synced_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        db_table = "cms_scenario_assignment"
        verbose_name = "Scenario Assignment"
        verbose_name_plural = "Scenario Assignments"
        ordering = ["-assigned_at"]
        indexes = [
            models.Index(fields=["school", "synced_at"]),
        ]

    def __str__(self):
        return f"{self.scenario_title} - {self.school.school_name}"


class StudentAttempt(models.Model):
    STATUS_CHOICES = [
        ("STARTED", "Started"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("ABANDONED", "Abandoned"),
    ]

    assignment = models.ForeignKey(
        ScenarioAssignment,
        on_delete=models.CASCADE,
        related_name="attempts"
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_attempts",
        limit_choices_to={"role": "STUDENT"}
    )
    school = models.ForeignKey(
        "super_admin.School",
        on_delete=models.CASCADE,
        related_name="student_attempts"
    )
    started_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="STARTED")
    total_score = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_score = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    time_spent_seconds = models.IntegerField(null=True, blank=True)
    synced_at = models.DateTimeField(auto_now=True, db_index=True)
    lms_attempt_id = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = "cms_student_attempt"
        verbose_name = "Student Attempt"
        verbose_name_plural = "Student Attempts"
        ordering = ["-started_at"]
        indexes = [
            models.Index(fields=["school", "synced_at"]),
            models.Index(fields=["student", "assignment"]),
        ]

    def __str__(self):
        return f"{self.student.username} - {self.assignment.scenario_title} ({self.status})"


class ScreenResponse(models.Model):
    attempt = models.ForeignKey(
        StudentAttempt,
        on_delete=models.CASCADE,
        related_name="screen_responses"
    )
    school = models.ForeignKey(
        "super_admin.School",
        on_delete=models.CASCADE,
        related_name="screen_responses"
    )
    screen_ref = models.CharField(max_length=255)
    screen_title = models.CharField(max_length=255)
    screen_type = models.CharField(max_length=100)
    response_data = models.JSONField(default=dict, blank=True)
    score = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_score = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_correct = models.BooleanField(null=True, blank=True)
    time_spent_seconds = models.IntegerField(null=True, blank=True)
    synced_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        db_table = "cms_screen_response"
        verbose_name = "Screen Response"
        verbose_name_plural = "Screen Responses"
        ordering = ["attempt", "screen_ref"]
        indexes = [
            models.Index(fields=["school", "synced_at"]),
        ]

    def __str__(self):
        return f"Response to {self.screen_title} on attempt {self.attempt.lms_attempt_id}"
