from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import Grade, School, SchoolAdminProfile, PublishContent, License, LmsServer

User = get_user_model()


class LmsServerSerializer(serializers.ModelSerializer):
    createdDate = serializers.DateTimeField(source='activationDate', read_only=True)

    class Meta:
        model = LmsServer
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if not ret.get('expiryDate') and instance.license and instance.license.expiryDate:
            ret['expiryDate'] = str(instance.license.expiryDate)
        if not ret.get('licenseDuration') and instance.license and instance.license.licenseDuration:
            ret['licenseDuration'] = instance.license.licenseDuration
        return ret


class LicenseSerializer(serializers.ModelSerializer):
    lms_servers = LmsServerSerializer(many=True, read_only=True)

    class Meta:
        model = License
        fields = '__all__'


class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = '__all__'


class GradeDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = '__all__'


class SchoolSerializer(serializers.ModelSerializer):
    license = LicenseSerializer(source='school_license', read_only=True)
    lms_servers = LmsServerSerializer(many=True, read_only=True)
    admin_name = serializers.SerializerMethodField()
    admin_username = serializers.SerializerMethodField()
    admin_email = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = '__all__'

    def get_admin_user(self, obj):
        if obj.schoolAdminId:
            return obj.schoolAdminId
        profile = SchoolAdminProfile.objects.filter(school=obj).select_related('user').first()
        if profile and profile.user:
            return profile.user
        return None

    def get_admin_name(self, obj):
        admin = self.get_admin_user(obj)
        if admin:
            return admin.full_name or admin.username or ""
        return ""

    def get_admin_username(self, obj):
        admin = self.get_admin_user(obj)
        if admin:
            return admin.username or ""
        return ""

    def get_admin_email(self, obj):
        admin = self.get_admin_user(obj)
        if admin:
            return admin.email or ""
        return ""

    def validate(self, attrs):
        email = attrs.get('email')
        contactEmail = attrs.get('contactEmail')
        
        # Check email
        if email:
            qs = School.objects.filter(email=email) | School.objects.filter(contactEmail=email)
            if self.instance:
                qs = qs.exclude(school_id=self.instance.school_id)
            if qs.exists():
                raise serializers.ValidationError({"email": "A school with this email address already exists."})
                
        # Check contactEmail
        if contactEmail:
            qs = School.objects.filter(email=contactEmail) | School.objects.filter(contactEmail=contactEmail)
            if self.instance:
                qs = qs.exclude(school_id=self.instance.school_id)
            if qs.exists():
                raise serializers.ValidationError({"contactEmail": "A school with this email address already exists."})
                
        return attrs



from django.core.exceptions import ValidationError as DjangoValidationError

class SchoolAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    school = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(),
        write_only=True,
        required=False,
    )
    school_id = serializers.IntegerField(source="school_admin_profile.school_id", read_only=True)
    school_name = serializers.CharField(source="school_admin_profile.school.school_name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "role",
            "is_active",
            "password",
            "school",
            "school_id",
            "school_name",
        ]
        extra_kwargs = {
            "role": {"read_only": True},
            "username": {"required": False},
        }

    def validate(self, attrs):
        if not self.instance:
            if "username" not in attrs:
                raise serializers.ValidationError({"username": "Username is required for creation."})
            if "password" not in attrs:
                raise serializers.ValidationError({"password": "Password is required for creation."})
            if "school" not in attrs:
                raise serializers.ValidationError({"school": "School assignment is required for creation."})
            if User.objects.filter(username=attrs["username"]).exists():
                raise serializers.ValidationError({"username": "A user with that username already exists."})
            try:
                validate_password(attrs["password"])
            except DjangoValidationError as e:
                raise serializers.ValidationError({"password": list(e.messages)})
        return attrs

    def create(self, validated_data):
        school = validated_data.pop("school")
        validated_data["role"] = User.Role.SCHOOL_ADMIN
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        SchoolAdminProfile.objects.create(user=user, school=school)

        # Automatically send password email to School Admin's email
        if user.email:
            try:
                from django.core.mail import send_mail
                from django.conf import settings
                subject = f"Welcome to Language Lab - School Admin Credentials ({school.school_name})"
                message = f"""Dear {user.username},

Your School Admin account for '{school.school_name}' has been created successfully.

Login Credentials:
--------------------------------------------
Username: {user.username}
Password: {password}
--------------------------------------------

Please log in to your School Admin portal using the details above.

Best regards,
Language Lab Team
"""
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@languagelab.com"),
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception as e:
                pass

        return user

    def update(self, instance, validated_data):
        school = validated_data.pop("school", None)
        validated_data.pop("username", None)
        validated_data.pop("password", None)
        user = super().update(instance, validated_data)

        if school is not None:
            profile, _ = SchoolAdminProfile.objects.get_or_create(user=user)
            profile.school = school
            profile.save()
        return user


class PublishContentSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source="grade.grade_name", read_only=True)

    class Meta:
        model = PublishContent
        fields = '__all__'
