from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class LoginSerializer(serializers.Serializer):
    """
    Serializer for handling user login credentials.
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for registering users with specific roles.
    Only authorized roles can be selected, and the password is securely hashed.
    """
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.STUDENT)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "role", "full_name")

    def create(self, validated_data):
        password = validated_data.pop("password")
        # create_user automatically handles username, email, full_name, role, and hashes the password
        user = User.objects.create_user(password=password, **validated_data)
        return user