from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from accounts.scoping import get_user_school
from .models import Class, Teacher, TeacherClass

User = get_user_model()


class TeacherSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    full_name = serializers.CharField(required=True)
    is_active = serializers.BooleanField(required=False, default=True)
    school_name = serializers.CharField(source='school.school_name', read_only=True)
    assigned_classes = serializers.SerializerMethodField()
    assigned_class_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = Teacher
        fields = ['teacher_id', 'user', 'email', 'full_name', 'is_active', 'school', 'school_name', 'qualification', 'assigned_classes', 'assigned_class_ids']
        extra_kwargs = {'user': {'read_only': True}}

    def get_assigned_classes(self, obj):
        classes = Class.objects.filter(teacherclass__teacher=obj)
        return ", ".join([c.class_name for c in classes])

    def to_representation(self, instance):
        ret = {
            'teacher_id': instance.teacher_id,
            'user': instance.user_id,
            'school': instance.school_id,
            'school_name': instance.school.school_name if instance.school else '',
            'qualification': instance.qualification or '',
            'assigned_classes': self.get_assigned_classes(instance),
            'assigned_class_ids': list(TeacherClass.objects.filter(teacher=instance).values_list('class_obj_id', flat=True))
        }
        if instance.user:
            ret['email'] = instance.user.email
            ret['full_name'] = instance.user.full_name
            ret['is_active'] = instance.user.is_active
        else:
            ret['email'] = ''
            ret['full_name'] = ''
            ret['is_active'] = False
        return ret

    def validate(self, attrs):
        request = self.context.get("request")
        email = attrs.get("email")
        
        if not self.instance:
            if not email:
                raise serializers.ValidationError({"email": "Email is required for creation."})
            # Check unique username/email
            if User.objects.filter(username=email).exists() or User.objects.filter(email=email).exists():
                raise serializers.ValidationError({"email": "A user with that email already exists."})
            
            if request and request.user.role == "SCHOOL_ADMIN":
                admin_school = get_user_school(request.user)
                if not admin_school:
                    raise serializers.ValidationError("Your account is not linked to a school.")
                attrs["school"] = admin_school
        else:
            # Updating: check email uniqueness if it changed
            if email and email != self.instance.user.email:
                if User.objects.filter(username=email).exists() or User.objects.filter(email=email).exists():
                    raise serializers.ValidationError({"email": "A user with that email already exists."})

        if request and request.user.role == "SCHOOL_ADMIN":
            admin_school = get_user_school(request.user)
            if admin_school and attrs.get("school") and attrs["school"] != admin_school:
                raise serializers.ValidationError({"school": "You can only manage teachers in your own school."})
        return attrs

    def create(self, validated_data):
        assigned_class_ids = validated_data.pop('assigned_class_ids', None)
        email = validated_data.pop('email')
        full_name = validated_data.pop('full_name', '')
        is_active = validated_data.pop('is_active', True)

        with transaction.atomic():
            # Automatically set username to email and password to Teacher123!
            user = User.objects.create_user(
                username=email,
                password="Teacher123!",
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

        with transaction.atomic():
            user = instance.user
            if user:
                if email is not None:
                    user.email = email
                    user.username = email  # Keep username in sync with email
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
