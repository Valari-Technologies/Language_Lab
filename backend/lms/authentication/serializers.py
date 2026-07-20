from rest_framework import serializers


class RollNumberLoginSerializer(serializers.Serializer):
    """
    Serializer for passwordless LMS Roll Number authentication ingestion.
    """
    roll_number = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        max_length=150,
        help_text="Student roll number or username"
    )
