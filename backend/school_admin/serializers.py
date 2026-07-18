from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from accounts.scoping import get_user_school
from .models import Class, Teacher, TeacherClass

User = get_user_model()


class TeacherSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(required=False)
    full_name = serializers.CharField(required=False)
    is_active = serializers.BooleanField(required=False, default=True)
    school_name = serializers.CharField(source='school.school_name', read_only=True)
    assigned_classes = serializers.SerializerMethodField()
    assigned_class_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = Teacher
        fields = ['teacher_id', 'user', 'username', 'password', 'email', 'full_name', 'is_active', 'school', 'school_name', 'qualification', 'experience_years', 'assigned_classes', 'assigned_class_ids']
        extra_kwargs = {'user': {'read_only': True}}

    def get_assigned_classes(self, obj):
        classes = Class.objects.filter(teacherclass__teacher=obj)
        return ", ".join([c.class_name for c in classes])

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.user:
            ret['username'] = instance.user.username
            ret['email'] = instance.user.email
            ret['full_name'] = instance.user.full_name
            ret['is_active'] = instance.user.is_active
        else:
            ret['username'] = ''
            ret['email'] = ''
            ret['full_name'] = ''
            ret['is_active'] = False
        ret['assigned_class_ids'] = list(TeacherClass.objects.filter(teacher=instance).values_list('class_obj_id', flat=True))
        return ret

    def validate(self, attrs):
        request = self.context.get("request")
        if not self.instance:
            if "username" not in attrs:
                raise serializers.ValidationError({"username": "Username is required for creation."})
            if "password" not in attrs:
                raise serializers.ValidationError({"password": "Password is required for creation."})
            if User.objects.filter(username=attrs["username"]).exists():
                raise serializers.ValidationError({"username": "A user with that username already exists."})
            validate_password(attrs["password"])
            if request and request.user.role == "SCHOOL_ADMIN":
                admin_school = get_user_school(request.user)
                if not admin_school:
                    raise serializers.ValidationError("Your account is not linked to a school.")
                attrs["school"] = admin_school
        elif request and request.user.role == "SCHOOL_ADMIN":
            admin_school = get_user_school(request.user)
            if admin_school and attrs.get("school") and attrs["school"] != admin_school:
                raise serializers.ValidationError({"school": "You can only manage teachers in your own school."})
        return attrs

    def create(self, validated_data):
        assigned_class_ids = validated_data.pop('assigned_class_ids', None)
        username = validated_data.pop('username')
        password = validated_data.pop('password')
        email = validated_data.pop('email', '')
        full_name = validated_data.pop('full_name', '')
        is_active = validated_data.pop('is_active', True)

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
                full_name=full_name,
                role=User.Role.TEACHER,
                is_active=is_active
            )
            teacher = Teacher.objects.create(user=user, **validated_data)
            if assigned_class_ids is not None:
                classes = Class.objects.filter(class_id__in=assigned_class_ids, school=teacher.school)
                for c in classes:
                    TeacherClass.objects.create(teacher=teacher, class_obj=c)
            return teacher

    def update(self, instance, validated_data):
        assigned_class_ids = validated_data.pop('assigned_class_ids', None)
        email = validated_data.pop('email', None)
        full_name = validated_data.pop('full_name', None)
        is_active = validated_data.pop('is_active', None)
        validated_data.pop('username', None)
        validated_data.pop('password', None)

        with transaction.atomic():
            user = instance.user
            if user:
                if email is not None:
                    user.email = email
                if full_name is not None:
                    user.full_name = full_name
                if is_active is not None:
                    user.is_active = is_active
                user.save()

            teacher = super().update(instance, validated_data)
            if assigned_class_ids is not None:
                TeacherClass.objects.filter(teacher=teacher).delete()
                classes = Class.objects.filter(class_id__in=assigned_class_ids, school=teacher.school)
                for c in classes:
                    TeacherClass.objects.create(teacher=teacher, class_obj=c)
            return teacher


class ClassSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.school_name', read_only=True)
    grade_name = serializers.CharField(source='grade.grade_name', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    assigned_teacher_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = Class
        fields = ['class_id', 'school', 'school_name', 'class_name', 'grade', 'grade_name', 'academic_year', 'is_active', 'teacher_name', 'assigned_teacher_ids', 'created_at', 'updated_at']

    def get_teacher_name(self, obj):
        teachers = Teacher.objects.filter(teacherclass__class_obj=obj)
        names = []
        for t in teachers:
            if t.user:
                names.append(t.user.full_name or t.user.username)
        return ", ".join(names) if names else None

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['assigned_teacher_ids'] = list(TeacherClass.objects.filter(class_obj=instance).values_list('teacher_id', flat=True))
        return ret

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.user.role in ["SCHOOL_ADMIN", "TEACHER"]:
            admin_school = get_user_school(request.user)
            if not admin_school:
                raise serializers.ValidationError("Your account is not linked to a school.")
            attrs["school"] = admin_school
        return attrs

    def create(self, validated_data):
        assigned_teacher_ids = validated_data.pop('assigned_teacher_ids', None)
        with transaction.atomic():
            class_obj = super().create(validated_data)
            if assigned_teacher_ids is not None:
                teachers = Teacher.objects.filter(teacher_id__in=assigned_teacher_ids, school=class_obj.school)
                for t in teachers:
                    TeacherClass.objects.create(teacher=t, class_obj=class_obj)
            return class_obj

    def update(self, instance, validated_data):
        assigned_teacher_ids = validated_data.pop('assigned_teacher_ids', None)
        with transaction.atomic():
            class_obj = super().update(instance, validated_data)
            if assigned_teacher_ids is not None:
                TeacherClass.objects.filter(class_obj=class_obj).delete()
                teachers = Teacher.objects.filter(teacher_id__in=assigned_teacher_ids, school=class_obj.school)
                for t in teachers:
                    TeacherClass.objects.create(teacher=t, class_obj=class_obj)
            return class_obj


class TeacherClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherClass
        fields = '__all__'
