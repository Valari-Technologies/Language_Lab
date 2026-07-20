from rest_framework import serializers


class AttemptSyncItemSerializer(serializers.Serializer):
    lms_attempt_id = serializers.CharField(max_length=255, required=True)
    experience_ref = serializers.CharField(max_length=255, required=False, allow_blank=True)
    experience_id = serializers.CharField(max_length=255, required=False, allow_blank=True)
    experience_title = serializers.CharField(max_length=255, required=False, allow_blank=True, default="Lesson")
    started_at = serializers.DateTimeField(required=True)
    completed_at = serializers.DateTimeField(required=False, allow_null=True)
    status = serializers.CharField(max_length=20, required=False, default="STARTED")
    total_score = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    max_score = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    time_spent_seconds = serializers.IntegerField(required=False, allow_null=True)


class ProgressSyncItemSerializer(serializers.Serializer):
    lms_attempt_id = serializers.CharField(max_length=255, required=True)
    screen_ref = serializers.CharField(max_length=255, required=True)
    screen_title = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    screen_type = serializers.CharField(max_length=100, required=False, allow_blank=True, default="INFORMATION")
    response_data = serializers.JSONField(required=False, default=dict)
    score = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    max_score = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    is_correct = serializers.BooleanField(required=False, allow_null=True)
    time_spent_seconds = serializers.IntegerField(required=False, allow_null=True)


class CompletionSyncItemSerializer(serializers.Serializer):
    lms_attempt_id = serializers.CharField(max_length=255, required=True)
    completed_at = serializers.DateTimeField(required=False, allow_null=True)
    total_score = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    max_score = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
