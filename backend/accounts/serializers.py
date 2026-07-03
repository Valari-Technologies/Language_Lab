
from rest_framework import serializers



class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class CommonLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=[
        ("SCHOOL_ADMIN", "School Admin"),
        ("TEACHER", "Teacher"),
        ("STUDENT", "Student"),
    ])