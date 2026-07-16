from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from django.db import transaction
from django.contrib.auth import get_user_model

from accounts.permissions import IsSuperAdminOrSchoolAdminWrite
from accounts.scoping import filter_queryset_by_school, get_user_school
from super_admin.views import CMSBaseViewSet
from super_admin.models import School, Grade
from teacher.models import Student
from .models import Class, Teacher, TeacherClass
from .serializers import ClassSerializer, TeacherClassSerializer, TeacherSerializer
import openpyxl


class TeacherViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdminOrSchoolAdminWrite]
    queryset = Teacher.objects.select_related("user", "school").all()
    serializer_class = TeacherSerializer
    search_fields = ["user__username", "qualification"]

    def get_queryset(self):
        return filter_queryset_by_school(
            Teacher.objects.select_related("user", "school").all(),
            self.request.user,
        )


class ClassViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdminOrSchoolAdminWrite]
    queryset = Class.objects.select_related("school", "grade").all()
    serializer_class = ClassSerializer
    search_fields = ["class_name"]

    def get_queryset(self):
        return filter_queryset_by_school(
            Class.objects.select_related("school", "grade").all(),
            self.request.user,
        )


class TeacherClassViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdminOrSchoolAdminWrite]
    queryset = TeacherClass.objects.select_related("teacher", "class_obj").all()
    serializer_class = TeacherClassSerializer

    def get_queryset(self):
        school = get_user_school(self.request.user)
        queryset = TeacherClass.objects.select_related("teacher", "class_obj").all()
        if school is None:
            if self.request.user.role == "SUPER_ADMIN" or self.request.user.is_superuser:
                return queryset
            return queryset.none()
        return queryset.filter(class_obj__school=school)


class BulkUploadAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        # 1. Enforce RBAC logic and permission matrix
        user = request.user
        role = getattr(user, 'role', None)

        if role not in ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"]:
            return Response(
                {"error": "Access Denied: Invalid role for bulk upload."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 2. Extract inputs
        upload_type = request.data.get("upload_type")
        if not upload_type or upload_type not in ["teacher", "student"]:
            return Response(
                {"error": "Invalid or missing upload_type. Must be 'teacher' or 'student'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # TEACHER can upload ONLY student sheets
        if role == "TEACHER" and upload_type == "teacher":
            return Response(
                {"error": "Access Denied: Teachers cannot upload teacher sheets."},
                status=status.HTTP_403_FORBIDDEN
            )

        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"error": "No file uploaded. Please supply a file in the multipart request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. File infrastructure controls (size & extension validation)
        file_name = uploaded_file.name
        if not (file_name.endswith(".xlsx") or file_name.endswith(".xls")):
            return Response(
                {"error": "Invalid file format. Only .xlsx and .xls are supported."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if uploaded_file.size > 5 * 1024 * 1024:
            return Response(
                {"error": "File size exceeds the 5MB limit."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. School context scoping (multi-tenant boundaries)
        if role == "SUPER_ADMIN":
            school_id = request.data.get("school_id")
            if not school_id:
                return Response(
                    {"error": "school_id is required for super admin upload."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                school = School.objects.get(school_id=school_id)
            except School.DoesNotExist:
                return Response(
                    {"error": "School not found."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            school = get_user_school(user)
            if not school:
                return Response(
                    {"error": "Your account is not linked to a school context."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 5. Parse spreadsheet using openpyxl
        try:
            wb = openpyxl.load_workbook(uploaded_file, data_only=True)
            sheet = wb.active
        except Exception as e:
            return Response(
                {"error": f"Failed to parse Excel file: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        rows = list(sheet.iter_rows(values_only=True))
        if not rows:
            return Response(
                {"error": "The uploaded file is empty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Normalize headers (lowercase and strip spaces)
        headers = [str(h).strip().lower() if h is not None else "" for h in rows[0]]

        if "username" not in headers or "password" not in headers:
            return Response(
                {"error": "Missing required column headers. Must include 'username' and 'password'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 6. Row Ingestion Processing
        User = get_user_model()
        created_count = 0
        failed_count = 0
        errors = []

        data_rows = rows[1:]
        for idx, row in enumerate(data_rows, start=2):
            # Cleanly skip completely empty rows
            if not any(cell is not None for cell in row):
                continue

            row_data = {}
            for col_idx, header in enumerate(headers):
                if header and col_idx < len(row):
                    row_data[header] = row[col_idx]

            try:
                with transaction.atomic():
                    # Parse username and password
                    username_val = row_data.get("username")
                    password_val = row_data.get("password")

                    if username_val is None or not str(username_val).strip():
                        raise ValueError("Username is required.")
                    if password_val is None or not str(password_val).strip():
                        raise ValueError("Password is required.")

                    username = str(username_val).strip()
                    password = str(password_val).strip()

                    if User.objects.filter(username=username).exists():
                        raise ValueError(f"Username '{username}' already exists.")

                    # Password strength validation
                    try:
                        from django.contrib.auth.password_validation import validate_password
                        validate_password(password, user=None)
                    except Exception as ve:
                        err_msgs = getattr(ve, "messages", [str(ve)])
                        raise ValueError(f"Password validation failed: {', '.join(err_msgs)}")

                    # Extract user details
                    email = str(row_data.get("email", "")).strip() if row_data.get("email") is not None else ""
                    full_name = str(row_data.get("full_name", "")).strip() if row_data.get("full_name") is not None else ""

                    is_active_val = row_data.get("is_active")
                    if is_active_val is not None:
                        if isinstance(is_active_val, str):
                            is_active = is_active_val.strip().lower() in ["true", "1", "yes", "active"]
                        else:
                            is_active = bool(is_active_val)
                    else:
                        is_active = True

                    # Upload Logic
                    if upload_type == "teacher":
                        qualification = str(row_data.get("qualification", "")).strip() if row_data.get("qualification") is not None else ""
                        
                        exp_val = row_data.get("experience_years")
                        experience_years = None
                        if exp_val is not None:
                            try:
                                experience_years = int(exp_val)
                            except ValueError:
                                raise ValueError(f"Invalid experience_years: '{exp_val}' must be an integer.")

                        # Validate Relational class fields
                        class_id_val = row_data.get("class_id")
                        class_ids_val = row_data.get("class_ids")
                        
                        classes_to_link = []

                        if class_id_val is not None:
                            try:
                                class_id = int(class_id_val)
                                cls = Class.objects.filter(class_id=class_id, school=school).first()
                                if not cls:
                                    raise ValueError(f"Class with ID {class_id} does not exist or does not belong to this school.")
                                classes_to_link.append(cls)
                            except ValueError as ve:
                                if "does not exist" in str(ve):
                                    raise ve
                                raise ValueError(f"Invalid class_id: '{class_id_val}' must be an integer.")

                        if class_ids_val is not None:
                            ids_list = [id_str.strip() for id_str in str(class_ids_val).split(",") if id_str.strip()]
                            for id_str in ids_list:
                                try:
                                    class_id = int(id_str)
                                    cls = Class.objects.filter(class_id=class_id, school=school).first()
                                    if not cls:
                                        raise ValueError(f"Class with ID {class_id} does not exist or does not belong to this school.")
                                    classes_to_link.append(cls)
                                except ValueError as ve:
                                    if "does not exist" in str(ve):
                                        raise ve
                                    raise ValueError(f"Invalid class_id in list: '{id_str}' must be an integer.")

                        # Create Django auth user
                        new_user = User.objects.create_user(
                            username=username,
                            password=password,
                            email=email,
                            full_name=full_name,
                            role=User.Role.TEACHER,
                            is_active=is_active
                        )

                        # Create Teacher profile record
                        teacher = Teacher.objects.create(
                            user=new_user,
                            school=school,
                            qualification=qualification,
                            experience_years=experience_years
                        )

                        # Map Teacher to classes
                        for cls in classes_to_link:
                            TeacherClass.objects.get_or_create(teacher=teacher, class_obj=cls)

                    elif upload_type == "student":
                        # Validate Relational fields
                        class_id_val = row_data.get("class_id")
                        grade_id_val = row_data.get("grade_id")

                        if class_id_val is not None:
                            try:
                                class_id = int(class_id_val)
                                if not Class.objects.filter(class_id=class_id, school=school).exists():
                                    raise ValueError(f"Class with ID {class_id} does not exist or does not belong to this school.")
                            except ValueError as ve:
                                if "does not exist" in str(ve):
                                    raise ve
                                raise ValueError(f"Invalid class_id: '{class_id_val}' must be an integer.")

                        if grade_id_val is not None:
                            try:
                                grade_id = int(grade_id_val)
                                if not Grade.objects.filter(pk=grade_id).exists():
                                    raise ValueError(f"Grade with ID {grade_id} does not exist.")
                            except ValueError as ve:
                                if "does not exist" in str(ve):
                                    raise ve
                                raise ValueError(f"Invalid grade_id: '{grade_id_val}' must be an integer.")

                        # Create Django auth user
                        new_user = User.objects.create_user(
                            username=username,
                            password=password,
                            email=email,
                            full_name=full_name,
                            role=User.Role.STUDENT,
                            is_active=is_active
                        )

                        # Create Student profile record
                        Student.objects.create(
                            user=new_user,
                            school=school
                        )

                    created_count += 1

            except Exception as e:
                failed_count += 1
                errors.append({"row": idx, "error": str(e)})

        return Response({
            "created": created_count,
            "failed": failed_count,
            "errors": errors
        }, status=status.HTTP_201_CREATED if created_count > 0 else status.HTTP_200_OK)



class TeacherViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdminOrSchoolAdminWrite]
    queryset = Teacher.objects.select_related("user", "school").all()
    serializer_class = TeacherSerializer
    search_fields = ["user__username", "qualification"]

    def get_queryset(self):
        return filter_queryset_by_school(
            Teacher.objects.select_related("user", "school").all(),
            self.request.user,
        )


class ClassViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdminOrSchoolAdminWrite]
    queryset = Class.objects.select_related("school", "grade").all()
    serializer_class = ClassSerializer
    search_fields = ["class_name"]

    def get_queryset(self):
        return filter_queryset_by_school(
            Class.objects.select_related("school", "grade").all(),
            self.request.user,
        )


class TeacherClassViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdminOrSchoolAdminWrite]
    queryset = TeacherClass.objects.select_related("teacher", "class_obj").all()
    serializer_class = TeacherClassSerializer

    def get_queryset(self):
        school = get_user_school(self.request.user)
        queryset = TeacherClass.objects.select_related("teacher", "class_obj").all()
        if school is None:
            if self.request.user.role == "SUPER_ADMIN" or self.request.user.is_superuser:
                return queryset
            return queryset.none()
        return queryset.filter(class_obj__school=school)
