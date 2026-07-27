from django.db import models
from django.conf import settings

class SyncLog(models.Model):
    idempotency_key = models.CharField(max_length=255, unique=True, db_index=True)
    device_id = models.CharField(max_length=255, null=True, blank=True)
    student_roll_no = models.CharField(max_length=50, null=True, blank=True)
    synced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "lms_sync_log"
        verbose_name = "Sync Log"
        verbose_name_plural = "Sync Logs"

    def __str__(self):
        return f"{self.idempotency_key} - {self.student_roll_no}"


class StudentProgress(models.Model):
    student = models.ForeignKey(
        "teacher.Student",
        on_delete=models.CASCADE,
        related_name="sync_progress"
    )
    scenario_id = models.CharField(max_length=255, db_index=True)
    completed = models.BooleanField(default=False)
    last_accessed = models.DateTimeField(auto_now=True)
    total_time_spent = models.IntegerField(default=0)

    class Meta:
        db_table = "lms_student_progress"
        verbose_name = "Student Progress"
        verbose_name_plural = "Student Progress"
        unique_together = (("student", "scenario_id"),)

    def __str__(self):
        return f"{self.student.user.username} - {self.scenario_id} ({'Completed' if self.completed else 'In Progress'})"


class QuizAttempt(models.Model):
    student = models.ForeignKey(
        "teacher.Student",
        on_delete=models.CASCADE,
        related_name="sync_quizzes"
    )
    scenario_id = models.CharField(max_length=255, db_index=True)
    activity_id = models.CharField(max_length=255, db_index=True)
    screen_id = models.CharField(max_length=255, db_index=True)
    score = models.IntegerField(default=0)
    max_score = models.IntegerField(default=0)
    answers = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField()

    class Meta:
        db_table = "lms_quiz_attempt"
        verbose_name = "Quiz Attempt"
        verbose_name_plural = "Quiz Attempts"

    def __str__(self):
        return f"{self.student.user.username} - Screen {self.screen_id} ({self.score}/{self.max_score})"


class ActivityReport(models.Model):
    student = models.ForeignKey(
        "teacher.Student",
        on_delete=models.CASCADE,
        related_name="sync_activities"
    )
    scenario_id = models.CharField(max_length=255, db_index=True)
    activity_id = models.CharField(max_length=255, db_index=True)
    time_spent_seconds = models.IntegerField(default=0)
    completed = models.BooleanField(default=False)
    timestamp = models.DateTimeField()

    class Meta:
        db_table = "lms_activity_report"
        verbose_name = "Activity Report"
        verbose_name_plural = "Activity Reports"

    def __str__(self):
        return f"{self.student.user.username} - Activity {self.activity_id} ({self.time_spent_seconds}s)"
