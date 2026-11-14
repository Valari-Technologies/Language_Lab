"""
LMS Hub in the CMS: what the school hub PC used to keep for the student PCs of a school
(paired computers, student sessions and seats, progress, resume positions).
"""
import uuid

from django.conf import settings
from django.db import models


class LmsDevice(models.Model):
    """A student PC paired with its school. Only the SHA-256 of its device token is stored."""
    school = models.ForeignKey("super_admin.School", on_delete=models.CASCADE, related_name="lms_devices")
    pc_id = models.UUIDField()
    pc_name = models.CharField(max_length=64)
    token_hash = models.CharField(max_length=64, unique=True)
    paired_at = models.DateTimeField()
    last_seen = models.DateTimeField(null=True, blank=True)
    last_ip = models.GenericIPAddressField(null=True, blank=True)
    revoked = models.BooleanField(default=False)

    class Meta:
        db_table = "lmshub_device"
        constraints = [models.UniqueConstraint(fields=["school", "pc_id"], name="lmshub_unique_device_per_school")]

    def __str__(self):
        return f"{self.pc_name} ({self.pc_id})"


class LmsPairingCode(models.Model):
    """The school's current 6-digit pairing code; a new one replaces it when it expires."""
    school = models.OneToOneField("super_admin.School", on_delete=models.CASCADE, related_name="lms_pairing_code")
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "lmshub_pairing_code"


class LmsSession(models.Model):
    """A student logged in on a paired PC. Active = not ended and a heartbeat within 120 s."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    token_hash = models.CharField(max_length=64, unique=True)
    student = models.ForeignKey("teacher.Student", on_delete=models.CASCADE, related_name="lms_sessions")
    device = models.ForeignKey(LmsDevice, on_delete=models.CASCADE, related_name="sessions")
    created_at = models.DateTimeField()
    last_heartbeat = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    end_reason = models.CharField(max_length=20, null=True, blank=True)  # replaced|logout|expired|pc_new_login|pc_removed

    class Meta:
        db_table = "lmshub_session"
        indexes = [models.Index(fields=["ended_at", "last_heartbeat"])]


class LmsProgressEvent(models.Model):
    """Every progress event received once; a repeated event_id changes nothing."""
    event_id = models.UUIDField(unique=True)
    student = models.ForeignKey("teacher.Student", on_delete=models.CASCADE, related_name="lms_events")
    device = models.ForeignKey(LmsDevice, on_delete=models.SET_NULL, null=True, related_name="events")
    type = models.CharField(max_length=12)  # completion | state | offline
    payload = models.JSONField()
    received_at = models.DateTimeField()
    # What happened to the report copy (StudentAttempt): saved | no_class | rejected | none
    attempt_status = models.CharField(max_length=12, blank=True)
    attempt_error = models.CharField(max_length=120, blank=True)

    class Meta:
        db_table = "lmshub_progress_event"
        indexes = [models.Index(fields=["received_at"])]


class LmsLevelProgress(models.Model):
    """Best result per student and map level (L1-L30, B1-B6)."""
    student = models.ForeignKey("teacher.Student", on_delete=models.CASCADE, related_name="lms_levels")
    level_key = models.CharField(max_length=3)
    package_id = models.CharField(max_length=64, null=True, blank=True)
    best_stars = models.PositiveSmallIntegerField(default=0)
    best_score = models.FloatField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    first_completed_at = models.DateTimeField(null=True, blank=True)
    last_completed_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField()

    class Meta:
        db_table = "lmshub_level_progress"
        constraints = [models.UniqueConstraint(fields=["student", "level_key"], name="lmshub_unique_level_per_student")]


class LmsStudentState(models.Model):
    """The merged map state of a student (unlocked level, stars, pieces, flags)."""
    student = models.OneToOneField("teacher.Student", on_delete=models.CASCADE, related_name="lms_state")
    state = models.JSONField(default=dict)
    updated_at = models.DateTimeField()

    class Meta:
        db_table = "lmshub_student_state"


class LmsResumePosition(models.Model):
    """Where a student stopped in a lesson; written only by the student's current session."""
    student = models.ForeignKey("teacher.Student", on_delete=models.CASCADE, related_name="lms_resume")
    package_id = models.CharField(max_length=64)
    level_key = models.CharField(max_length=3)
    package_version = models.CharField(max_length=50, blank=True)
    signature = models.CharField(max_length=300, blank=True)
    activity_index = models.PositiveSmallIntegerField()
    screen_index = models.PositiveSmallIntegerField()
    answered_block_ids = models.JSONField(default=list)
    session = models.ForeignKey(LmsSession, on_delete=models.SET_NULL, null=True)
    updated_at = models.DateTimeField()

    class Meta:
        db_table = "lmshub_resume_position"
        constraints = [models.UniqueConstraint(fields=["student", "package_id"], name="lmshub_unique_resume_per_package")]


class LmsHubAccess(models.Model):
    """
    The school's LMS Hub page was unlocked with the school licence key (once per school).
    Only a hash of that key is kept: when the school gets a new licence key, the page is locked again.
    """
    school = models.OneToOneField("super_admin.School", on_delete=models.CASCADE, related_name="lms_hub_access")
    license_key_hash = models.CharField(max_length=64)
    unlocked_at = models.DateTimeField()
    unlocked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        db_table = "lmshub_access"


class LmsThrottle(models.Model):
    """Wrong pairing codes / logins and offline-data calls, shared by all server processes."""
    key = models.CharField(max_length=120, unique=True)
    count = models.PositiveIntegerField(default=0)
    window_start = models.DateTimeField()
    locked_until = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "lmshub_throttle"
