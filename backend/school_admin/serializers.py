from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from accounts.scoping import get_user_school
from .models import Class, Teacher, TeacherClass

User = get_user_model()


class TeacherSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True, required=False)
    full_name = serializers.CharField(required=True)
    phone_no = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    is_active = serializers.BooleanField(required=False, default=True)
    school_name = serializers.CharField(source='school.school_name', read_only=True)
    assigned_classes = serializers.SerializerMethodField()
    assigned_class_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = Teacher
        fields = ['teacher_id', 'user', 'username', 'password', 'email', 'full_name', 'phone_no', 'is_active', 'school', 'school_name', 'qualification', 'assigned_classes', 'assigned_class_ids']
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
            ret['username'] = instance.user.username
            ret['email'] = instance.user.email
            ret['full_name'] = instance.user.full_name
            ret['phone_no'] = instance.user.phone_no or ''
            ret['is_active'] = instance.user.is_active
        else:
            ret['username'] = ''
            ret['email'] = ''
            ret['full_name'] = ''
            ret['phone_no'] = ''
            ret['is_active'] = False
        return ret

    def validate_phone_no(self, value):
        if value:
            cleaned = "".join(c for c in value if c.isdigit())
            if len(cleaned) != 10 or len(value) != 10:
                raise serializers.ValidationError("Phone number must be exactly 10 numeric digits.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        email = attrs.get("email")
        username = attrs.get("username")
        
        if not self.instance:
            if not email:
                raise serializers.ValidationError({"email": "Email is required for creation."})
            if not username:
                username = email
                attrs["username"] = username
            # Check unique username/email
            if User.objects.filter(username=username).exists():
                raise serializers.ValidationError({"username": "A user with that username already exists."})
            if User.objects.filter(email=email).exists():
                raise serializers.ValidationError({"email": "A user with that email already exists."})
            
            if request and request.user.role == "SCHOOL_ADMIN":
                admin_school = get_user_school(request.user)
                if not admin_school:
                    raise serializers.ValidationError("Your account is not linked to a school.")
                attrs["school"] = admin_school
        else:
            # Updating: check email/username uniqueness if it changed
            if email and email != self.instance.user.email:
                if User.objects.filter(email=email).exists():
                    raise serializers.ValidationError({"email": "A user with that email already exists."})
            if username and username != self.instance.user.username:
                if User.objects.filter(username=username).exists():
                    raise serializers.ValidationError({"username": "A user with that username already exists."})

        if request and request.user.role == "SCHOOL_ADMIN":
            admin_school = get_user_school(request.user)
            if admin_school and attrs.get("school") and attrs["school"] != admin_school:
                raise serializers.ValidationError({"school": "You can only manage teachers in your own school."})
        return attrs

    def create(self, validated_data):
        assigned_class_ids = validated_data.pop('assigned_class_ids', None)
        email = validated_data.pop('email')
        username = validated_data.pop('username', email)
        password = validated_data.pop('password', 'Teacher123!')
        full_name = validated_data.pop('full_name', '')
        phone_no = validated_data.pop('phone_no', '')
        is_active = validated_data.pop('is_active', True)

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
                full_name=full_name,
                role=User.Role.TEACHER,
                is_active=is_active,
                phone_no=phone_no
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
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        full_name = validated_data.pop('full_name', None)
        phone_no = validated_data.pop('phone_no', None)
        is_active = validated_data.pop('is_active', None)

        with transaction.atomic():
            user = instance.user
            if user:
                if email is not None:
                    user.email = email
                if username is not None and str(username).strip():
                    user.username = username
                if password is not None and str(password).strip():
                    user.set_password(password)
                if full_name is not None:
                    user.full_name = full_name
                if phone_no is not None:
                    user.phone_no = phone_no
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
    section = serializers.SerializerMethodField()
    assigned_teacher_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    assigned_lessons = serializers.SerializerMethodField()

    class Meta:
        model = Class
        fields = ['class_id', 'school', 'school_name', 'class_name', 'grade', 'grade_name', 'section', 'academic_year', 'is_active', 'teacher_name', 'assigned_teacher_ids', 'assigned_lessons', 'created_at', 'updated_at']

    def get_assigned_lessons(self, obj):
        from django.db.models import Q
        from assessments.models import ExperienceAssignment
        assignments = ExperienceAssignment.objects.filter(school=obj.school).filter(
            Q(class_obj=obj) | Q(class_obj__isnull=True, grade=obj.grade)
        ).values("id", "experience_ref", "experience_title", "assigned_at")
        return list(assignments)

    def get_teacher_name(self, obj):
        teachers = Teacher.objects.filter(teacherclass__class_obj=obj)
        names = []
        for t in teachers:
            if t.user:
                names.append(t.user.full_name or t.user.username)
        return ", ".join(names) if names else None

    def get_section(self, obj):
        """Extract section letter from class_name e.g. 'Class 3-A' -> 'A'"""
        name = obj.class_name or ''
        if '-' in name:
            part = name.split('-')[-1].strip().upper()
            if part and part.isalpha() and len(part) == 1:
                return part
        # fallback: last character if alpha
        if name and name[-1].isalpha():
            return name[-1].upper()
        return ''

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['assigned_teacher_ids'] = list(TeacherClass.objects.filter(class_obj=instance).values_list('teacher_id', flat=True))
        # Keep full class_name with section (e.g. "Class 3-A")
        name = ret.get("class_name") or ""
        # Ensure section prefix is "Section "
        sec = ret.get("section") or ""
        if sec and not sec.startswith("Section "):
            ret["section"] = f"Section {sec}"
        # Format grade_name to Class
        g_name = ret.get("grade_name") or ""
        if g_name:
            ret["grade_name"] = g_name.replace("Grade", "Class")
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
