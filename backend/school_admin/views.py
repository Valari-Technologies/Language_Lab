from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from django.db import transaction
from django.contrib.auth import get_user_model

from accounts.permissions import IsSuperAdminOrSchoolAdminWrite, IsInstituteAdmin, IsTeacherOrAdmin
from accounts.scoping import filter_queryset_by_school, get_user_school
from super_admin.views import CMSBaseViewSet
from super_admin.models import School, Grade, SchoolAdminProfile
from teacher.models import Student
from .models import Class, Teacher, TeacherClass
from .serializers import ClassSerializer, TeacherClassSerializer, TeacherSerializer
import openpyxl


class TeacherViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsInstituteAdmin]
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

    # ── Template columns definitions ──
    TEACHER_COLUMNS = [
        {"column": "name",          "required": True,  "description": "Full name of the teacher"},
        {"column": "email",         "required": True,  "description": "Email address (must be unique)"},
        {"column": "username",      "required": True,  "description": "Login username (must be unique)"},
        {"column": "password",      "required": True,  "description": "Initial login password"},
        {"column": "phone_no",      "required": True,  "description": "Phone number"},
        {"column": "qualification", "required": True,  "description": "Qualification (e.g. B.Ed, M.A.)"},
        {"column": "class",         "required": True,  "description": "Class/Grade to assign"},
        {"column": "section",       "required": True,  "description": "Section (e.g. A, B, C)"},
        {"column": "academic_year", "required": True,  "description": "Academic year (e.g. 2025-2026)"},
    ]

    STUDENT_COLUMNS = [
        {"column": "fullname",      "required": True,  "description": "Full name of the student"},
        {"column": "class",         "required": True,  "description": "Class/Grade name"},
        {"column": "section",       "required": True,  "description": "Section (e.g. A, B, C)"},
        {"column": "roll no",       "required": True,  "description": "Roll number"},
        {"column": "status",        "required": True,  "description": "Status (e.g. active, inactive)"},
        {"column": "academy year",  "required": True,  "description": "Academic year (e.g. 2025-2026)"},
    ]

    def get(self, request, *args, **kwargs):
        """GET /api/cms/v1/bulk-upload/?type=teacher|student — download .xlsx template."""
        from django.http import HttpResponse
        from io import BytesIO

        upload_type = request.query_params.get("type", "").lower()
        if upload_type not in ("teacher", "student"):
            return Response(
                {"error": "Query param 'type' is required. Must be 'teacher' or 'student'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        columns = self.TEACHER_COLUMNS if upload_type == "teacher" else self.STUDENT_COLUMNS

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = f"{upload_type.capitalize()} Import Template"

        # Write header row
        for col_idx, col_def in enumerate(columns, start=1):
            cell = ws.cell(row=1, column=col_idx, value=col_def["column"])
            cell.font = openpyxl.styles.Font(bold=True)

        # Auto-size columns roughly
        for col_idx, col_def in enumerate(columns, start=1):
            ws.column_dimensions[openpyxl.utils.get_column_letter(col_idx)].width = max(len(col_def["column"]) + 5, 15)

        buf = BytesIO()
        wb.save(buf)
        buf.seek(0)

        filename = f"{upload_type}_import_template.xlsx"
        response = HttpResponse(
            buf.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


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
        if not upload_type or upload_type not in ["teacher", "student", "school"]:
            return Response(
                {"error": "Invalid or missing upload_type. Must be 'teacher', 'student', or 'school'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Only SUPER_ADMIN can upload school sheets
        if upload_type == "school" and role != "SUPER_ADMIN":
            return Response(
                {"error": "Access Denied: Only SUPER_ADMIN can upload school sheets."},
                status=status.HTTP_403_FORBIDDEN
            )

        # TEACHER can upload ONLY student sheets
        if role == "TEACHER" and upload_type in ["teacher", "school"]:
            return Response(
                {"error": "Access Denied: Teachers cannot upload teacher or school sheets."},
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
        if upload_type != "school":
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

        def get_val(row_dict, *keys):
            for k in keys:
                if k in row_dict and row_dict[k] is not None:
                    return row_dict[k]
            return None

        def has_any(header_list, *candidates):
            return any(c in header_list for c in candidates)

        if upload_type == "school":
            required_cols = ["schoolname", "email", "password", "admin name", "location"]
            for col in required_cols:
                if col not in headers:
                    return Response(
                        {"error": f"Missing required column header: '{col}'."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        elif upload_type == "teacher":
            required_cols = ["name", "email", "username", "password", "phone_no", "qualification", "class", "section", "academic_year"]
            for col in required_cols:
                matched = any(col.replace("_", "").replace(" ", "") in h.replace("_", "").replace(" ", "") for h in headers)
                if not matched:
                    return Response(
                        {"error": f"Missing required column header: '{col}' for teacher imports."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        elif upload_type == "student":
            required_cols = ["fullname", "class", "section", "roll no", "status", "academy year"]
            for col in required_cols:
                norm_col = col.replace("_", "").replace(" ", "").lower()
                matched = any(
                    norm_col in h.replace("_", "").replace(" ", "").lower() or 
                    (norm_col == "fullname" and "name" in h.lower()) or 
                    (norm_col == "class" and "grade" in h.lower()) or
                    (norm_col == "rollno" and "roll" in h.lower()) or
                    (norm_col == "academyyear" and "academic" in h.lower())
                    for h in headers
                )
                if not matched:
                    return Response(
                        {"error": f"Missing required column header: '{col}' for student imports. Mandatory: fullname, class, section, roll no, status, academy year"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        # Roll No is always auto-generated from the student's full name (e.g. "Rahul" -> "RAH001"),
        # continuing the numeric sequence from the school's existing student count — any
        # rollno/roll_no column in the sheet is ignored for student imports.
        existing_roll_nos = set()
        next_roll_seq = 1
        if upload_type == "student":
            existing_roll_nos = {
                (r or "").strip().upper()
                for r in Student.objects.filter(school=school).values_list("roll_no", flat=True)
            }
            next_roll_seq = Student.objects.filter(school=school).count() + 1

        def generate_roll_no(full_name):
            nonlocal next_roll_seq
            clean_name = "".join(ch for ch in full_name if ch.isalpha())
            prefix = (clean_name[:3].upper() if clean_name else "STU").ljust(3, "X")
            candidate = f"{prefix}{next_roll_seq:03d}"
            while candidate in existing_roll_nos:
                next_roll_seq += 1
                candidate = f"{prefix}{next_roll_seq:03d}"
            existing_roll_nos.add(candidate)
            next_roll_seq += 1
            return candidate

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
                    if upload_type == "school":
                        school_name = row_data.get("schoolname")
                        email_val = row_data.get("email")
                        password_val = row_data.get("password")
                        admin_name = row_data.get("admin name")
                        location = row_data.get("location")

                        if not school_name or not str(school_name).strip():
                            raise ValueError("schoolname is required.")
                        if not email_val or not str(email_val).strip():
                            raise ValueError("email is required.")
                        if not password_val or not str(password_val).strip():
                            raise ValueError("password is required.")
                        if not admin_name or not str(admin_name).strip():
                            raise ValueError("admin name is required.")
                        if not location or not str(location).strip():
                            raise ValueError("location is required.")

                        school_name = str(school_name).strip()
                        email = str(email_val).strip()
                        password = str(password_val).strip()
                        admin_name = str(admin_name).strip()
                        location = str(location).strip()

                        if School.objects.filter(school_name=school_name).exists():
                            raise ValueError(f"School name '{school_name}' already exists.")

                        # Generate username from email prefix
                        username = email.split('@')[0].strip().lower()
                        import re
                        username = re.sub(r'[^a-zA-Z0-9_.-]', '', username)
                        if not username:
                            username = "admin"
                        
                        orig_username = username
                        suffix = 1
                        while User.objects.filter(username=username).exists():
                            username = f"{orig_username}{suffix}"
                            suffix += 1

                        if User.objects.filter(email=email).exists():
                            raise ValueError(f"A user with email '{email}' already exists.")

                        if len(password) < 4:
                            raise ValueError("Password must be at least 4 characters long.")

                        # Create School
                        school_obj = School.objects.create(
                            school_name=school_name,
                            address=location,
                            email=email,
                            phone="",
                            is_active=True
                        )
                        # Create User (School Admin)
                        user_obj = User.objects.create(
                            username=username,
                            email=email,
                            full_name=admin_name,
                            role=User.Role.SCHOOL_ADMIN,
                            is_active=True
                        )
                        user_obj.set_password(password)
                        user_obj.save()
                        # Link
                        SchoolAdminProfile.objects.create(user=user_obj, school=school_obj)
                        created_count += 1
                    else:
                        if upload_type == "teacher":
                            email_val = get_val(row_data, "email", "email_address", "email address")
                            fullname_val = get_val(row_data, "name", "full_name", "full name", "fullname", "teacher_name", "teacher name")
                            username_val = get_val(row_data, "username", "username", "user_name", "user name")
                            password_val = get_val(row_data, "password", "pass")
                            phone_val = get_val(row_data, "phone_no", "phone", "phone_number", "phone number")
                            qualification_val = get_val(row_data, "qualification", "qual")
                            class_grade_val = get_val(row_data, "class", "class_grade", "class grade", "grade")
                            section_val = get_val(row_data, "section", "class_section", "class section")
                            academic_year_val = get_val(row_data, "academic_year", "academic year", "year")

                            if not email_val or not str(email_val).strip(): raise ValueError("email is required for teacher.")
                            if not fullname_val or not str(fullname_val).strip(): raise ValueError("name is required for teacher.")
                            if not username_val or not str(username_val).strip(): raise ValueError("username is required for teacher.")
                            if not password_val or not str(password_val).strip(): raise ValueError("password is required for teacher.")
                            if not phone_val or not str(phone_val).strip(): raise ValueError("phone_no is required for teacher.")
                            if not qualification_val or not str(qualification_val).strip(): raise ValueError("qualification is required for teacher.")
                            if not class_grade_val or not str(class_grade_val).strip(): raise ValueError("class is required for teacher.")
                            if not section_val or not str(section_val).strip(): raise ValueError("section is required for teacher.")
                            if not academic_year_val or not str(academic_year_val).strip(): raise ValueError("academic_year is required for teacher.")

                            email = str(email_val).strip()
                            full_name = str(fullname_val).strip()
                            username = str(username_val).strip()
                            password = str(password_val).strip()
                            phone_no = str(phone_val).strip()
                            qualification = str(qualification_val).strip()
                            class_grade = str(class_grade_val).strip()
                            class_section = str(section_val).strip()
                            academic_year = str(academic_year_val).strip()

                            cleaned_phone = "".join(c for c in phone_no if c.isdigit())
                            if len(cleaned_phone) != 10 or len(phone_no) != 10:
                                raise ValueError("Phone number must be exactly 10 numeric digits.")

                            if User.objects.filter(username=username).exists():
                                raise ValueError(f"Username '{username}' already exists.")
                            if User.objects.filter(email=email).exists():
                                raise ValueError(f"A user with email '{email}' already exists.")

                            # Resolve or Create Grade & Class
                            classes_to_link = []
                            class_id_val = get_val(row_data, "class_id")
                            class_ids_val = get_val(row_data, "class_ids")

                            if class_id_val is not None and str(class_id_val).strip():
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
                            elif class_ids_val is not None and str(class_ids_val).strip():
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
                            else:
                                grades_list = [g.strip() for g in str(class_grade).split(",") if g.strip()]
                                sections_list = [s.strip() for s in str(class_section).split(",") if s.strip()]

                                for i, g_val in enumerate(grades_list):
                                    import re
                                    grade_match = re.search(r"\d+", g_val)
                                    grade_num = grade_match.group(0) if grade_match else g_val

                                    sec_val = "A"
                                    if i < len(sections_list):
                                        sec_val = sections_list[i]
                                    elif len(sections_list) > 0:
                                        sec_val = sections_list[-1]

                                    grade_obj = Grade.objects.filter(grade_name__icontains=grade_num).first()
                                    if not grade_obj:
                                        try:
                                            s_ord = int(grade_num)
                                        except ValueError:
                                            s_ord = 1
                                        grade_obj = Grade.objects.create(grade_name=f"Class {grade_num}", sort_order=s_ord)

                                    target_class_name = f"Class {grade_num}-{sec_val}"
                                    class_obj, _ = Class.objects.get_or_create(
                                        class_name=target_class_name,
                                        school=school,
                                        grade=grade_obj,
                                        academic_year=academic_year,
                                        defaults={"is_active": True}
                                    )
                                    classes_to_link.append(class_obj)

                            # Create Django auth user
                            new_user = User.objects.create_user(
                                username=username,
                                password=password,
                                email=email,
                                full_name=full_name,
                                role=User.Role.TEACHER,
                                is_active=True,
                                phone_no=phone_no
                            )

                            # Create Teacher profile record
                            teacher = Teacher.objects.create(
                                user=new_user,
                                school=school,
                                qualification=qualification
                            )

                            # Map Teacher to classes
                            for cls in classes_to_link:
                                TeacherClass.objects.get_or_create(teacher=teacher, class_obj=cls)

                        elif upload_type == "student":
                            fullname_val = get_val(row_data, "fullname", "full_name", "full name", "name", "student_name")
                            grade_val = get_val(row_data, "class", "grade", "grade_name", "grade name")
                            section_val = get_val(row_data, "section", "class_section", "class section")
                            roll_no_val = get_val(row_data, "roll_no", "roll no", "rollnumber", "roll number")
                            status_val = get_val(row_data, "status", "is_active", "is active", "active")
                            academic_year_val = get_val(row_data, "academy_year", "academy year", "academic_year", "academic year", "year")

                            if not fullname_val or not str(fullname_val).strip(): raise ValueError("fullname is required for student.")
                            if not grade_val or not str(grade_val).strip(): raise ValueError("class/grade is required for student.")
                            if not section_val or not str(section_val).strip(): raise ValueError("section is required for student.")
                            if not roll_no_val or not str(roll_no_val).strip(): raise ValueError("roll no is required for student.")
                            if status_val is None or not str(status_val).strip(): raise ValueError("status is required for student.")
                            if not academic_year_val or not str(academic_year_val).strip(): raise ValueError("academy year is required for student.")

                            full_name = str(fullname_val).strip()
                            grade = str(grade_val).strip()
                            section = str(section_val).strip()
                            roll_no = str(roll_no_val).strip()
                            status_str = str(status_val).strip().lower()
                            academic_year = str(academic_year_val).strip()

                            # Auto generate lms login code (username) from full name
                            clean_name = "".join(ch for ch in full_name if ch.isalnum()).lower()
                            if not clean_name:
                                clean_name = "student"
                            username = clean_name
                            orig_username = username
                            suffix = 1
                            while User.objects.filter(username=username).exists():
                                username = f"{orig_username}{suffix}"
                                suffix += 1

                            # Password defaults to username (or lms login code)
                            password = username
                            # Email defaults to username@lingualab.com
                            email = f"{username}@lingualab.com"

                            # Parse status (is_active)
                            is_active = True
                            if status_str in ["inactive", "false", "0", "no", "disabled"]:
                                is_active = False

                            if User.objects.filter(email=email).exists():
                                raise ValueError(f"A user with email '{email}' already exists.")

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
                                school=school,
                                roll_no=roll_no,
                                grade=grade,
                                section=section,
                                academic_year=academic_year
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

    def perform_destroy(self, instance):
        super().perform_destroy(instance)


class ClassViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]
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
