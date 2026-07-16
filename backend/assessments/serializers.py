from rest_framework import serializers
from django.contrib.auth import get_user_model
from super_admin.models import Grade, School
from school_admin.models import Class
from teacher.models import Student
from .models import ScenarioAssignment, StudentAttempt, ScreenResponse

User = get_user_model()


class ScenarioAssignmentSyncSerializer(serializers.Serializer):
    scenario_ref = serializers.CharField(max_length=255)
    scenario_title = serializers.CharField(max_length=255)
    grade = serializers.PrimaryKeyRelatedField(queryset=Grade.objects.all(), required=False, allow_null=True)
    class_obj = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all(), required=False, allow_null=True)
    assigned_by_username = serializers.CharField(max_length=150, required=False, allow_null=True)
    assigned_at = serializers.DateTimeField()
    school = serializers.PrimaryKeyRelatedField(queryset=School.objects.all(), required=False, allow_null=True)


class StudentAttemptSyncSerializer(serializers.Serializer):
    lms_attempt_id = serializers.CharField(max_length=255)
    scenario_ref = serializers.CharField(max_length=255, required=False, allow_null=True)
    student_username = serializers.CharField(max_length=150, required=False, allow_null=True)
    student = serializers.IntegerField(required=False, allow_null=True)
    assignment = serializers.IntegerField(required=False, allow_null=True)
    started_at = serializers.DateTimeField(required=False, allow_null=True)
    completed_at = serializers.DateTimeField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=StudentAttempt.STATUS_CHOICES, default="STARTED")
    total_score = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    max_score = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    time_spent_seconds = serializers.IntegerField(required=False, allow_null=True)
    school = serializers.PrimaryKeyRelatedField(queryset=School.objects.all(), required=False, allow_null=True)


class ScreenResponseSyncSerializer(serializers.Serializer):
    lms_attempt_id = serializers.CharField(max_length=255)
    screen_ref = serializers.CharField(max_length=255)
    screen_title = serializers.CharField(max_length=255)
    screen_type = serializers.CharField(max_length=100)
    response_data = serializers.JSONField(required=False, default=dict)
    score = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    max_score = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    is_correct = serializers.BooleanField(required=False, allow_null=True)
    time_spent_seconds = serializers.IntegerField(required=False, allow_null=True)


# Reports read-only serializers (for swagger API docs representation)
class OverviewReportSerializer(serializers.Serializer):
    total_students = serializers.IntegerField()
    total_attempts = serializers.IntegerField()
    total_completed = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    average_score = serializers.FloatField()
    pass_rate = serializers.FloatField()
    total_scenarios_attempted = serializers.IntegerField()
    recent_syncs = serializers.ListField(child=serializers.DateTimeField())


class ScenarioReportSerializer(serializers.Serializer):
    scenario_ref = serializers.CharField()
    scenario_title = serializers.CharField()
    total_attempts = serializers.IntegerField()
    completed = serializers.IntegerField()
    average_score = serializers.FloatField()
    pass_rate = serializers.FloatField()
    highest_score = serializers.FloatField()
    lowest_score = serializers.FloatField()
    average_time_seconds = serializers.FloatField()


class ClassReportSerializer(serializers.Serializer):
    class_id = serializers.IntegerField()
    class_name = serializers.CharField()
    total_students = serializers.IntegerField()
    attempted = serializers.IntegerField()
    completed = serializers.IntegerField()
    average_score = serializers.FloatField()
    pass_rate = serializers.FloatField()
    top_student = serializers.CharField()
    weakest_student = serializers.CharField()


class StudentReportSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    student_name = serializers.CharField()
    class_name = serializers.CharField()
    total_attempts = serializers.IntegerField()
    completed = serializers.IntegerField()
    average_score = serializers.FloatField()
    best_scenario = serializers.CharField()
    worst_scenario = serializers.CharField()
    last_attempt_date = serializers.DateTimeField()


class TeacherReportSerializer(serializers.Serializer):
    teacher_id = serializers.IntegerField()
    teacher_name = serializers.CharField()
    classes_count = serializers.IntegerField()
    total_students = serializers.IntegerField()
    average_class_score = serializers.FloatField()
    best_class = serializers.CharField()
    weakest_class = serializers.CharField()


class StudentCompletionReportSerializer(serializers.Serializer):
    student_id = serializers.IntegerField(source="id")
    student_name = serializers.SerializerMethodField()
    total_assigned_scenarios = serializers.IntegerField()
    completed_scenarios_count = serializers.IntegerField()

    def get_student_name(self, obj):
        return obj.full_name or obj.username

