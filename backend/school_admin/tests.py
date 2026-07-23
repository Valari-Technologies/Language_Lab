import io
import openpyxl
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from super_admin.models import School, Grade, SchoolAdminProfile
from school_admin.models import Class, Teacher, TeacherClass
from teacher.models import Student

User = get_user_model()


def create_mock_excel(headers, rows):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(headers)
    for row in rows:
        ws.append(row)
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    buffer.name = "mock_file.xlsx"
    return buffer


class BulkUploadAPITests(TestCase):
    def setUp(self):
        # 1. Create schools
        self.school_a = School.objects.create(
            school_name="School A",
            address="123 Road A",
            phone="555-0001",
            email="schoola@edu.com",
            is_active=True
        )
        self.school_b = School.objects.create(
            school_name="School B",
            address="456 Road B",
            phone="555-0002",
            email="schoolb@edu.com",
            is_active=True
        )

        # 2. Create users
        self.super_admin = User.objects.create_user(
            username="super_admin",
            password="SecurePass@123",
            role="SUPER_ADMIN",
            full_name="Global Super Admin"
        )
        self.school_admin_a = User.objects.create_user(
            username="school_admin_a",
            password="SecurePass@123",
            role="SCHOOL_ADMIN",
            full_name="School Admin A"
        )
        self.school_admin_b = User.objects.create_user(
            username="school_admin_b",
            password="SecurePass@123",
            role="SCHOOL_ADMIN",
            full_name="School Admin B"
        )
        self.teacher_a = User.objects.create_user(
            username="teacher_a",
            password="SecurePass@123",
            role="TEACHER",
            full_name="Teacher A"
        )
        self.student_a = User.objects.create_user(
            username="student_a",
            password="SecurePass@123",
            role="STUDENT",
            full_name="Student A"
        )

        # Create Profiles
        SchoolAdminProfile.objects.create(user=self.school_admin_a, school=self.school_a)
        SchoolAdminProfile.objects.create(user=self.school_admin_b, school=self.school_b)
        
        self.teacher_profile_a = Teacher.objects.create(
            user=self.teacher_a,
            school=self.school_a,
            qualification="B.Ed",
            experience_years=5
        )

        # 3. Create Grades & Classes
        self.grade_1 = Grade.objects.create(grade_name="Grade 1", sort_order=1)
        self.class_a = Class.objects.create(
            school=self.school_a,
            class_name="Class A",
            grade=self.grade_1,
            academic_year="2026",
            is_active=True
        )
        self.class_b = Class.objects.create(
            school=self.school_b,
            class_name="Class B",
            grade=self.grade_1,
            academic_year="2026",
            is_active=True
        )

        # Generate tokens for API requests
        self.token_super = str(RefreshToken.for_user(self.super_admin).access_token)
        self.token_admin_a = str(RefreshToken.for_user(self.school_admin_a).access_token)
        self.token_admin_b = str(RefreshToken.for_user(self.school_admin_b).access_token)
        self.token_teacher_a = str(RefreshToken.for_user(self.teacher_a).access_token)
        self.token_student_a = str(RefreshToken.for_user(self.student_a).access_token)

        self.url = reverse("bulk-upload")

    def test_unauthenticated_upload_rejected(self):
        excel_file = create_mock_excel(["username", "password"], [["u1", "p1"]])
        response = self.client.post(self.url, {"file": excel_file, "upload_type": "student"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_upload_denied(self):
        excel_file = create_mock_excel(["username", "password"], [["u1", "p1"]])
        response = self.client.post(
            self.url,
            {"file": excel_file, "upload_type": "student"},
            HTTP_AUTHORIZATION=f"Bearer {self.token_student_a}"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_uploading_teacher_sheet_denied(self):
        excel_file = create_mock_excel(["username", "password"], [["t1", "p1"]])
        response = self.client.post(
            self.url,
            {"file": excel_file, "upload_type": "teacher"},
            HTTP_AUTHORIZATION=f"Bearer {self.token_teacher_a}"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_uploading_student_sheet_allowed(self):
        # Teacher uploads valid student sheet with password strength validated
        excel_file = create_mock_excel(
            ["username", "password", "email", "full_name"],
            [["student_new_1", "SecurePass@123", "student1@edu.com", "Student One"]]
        )
        response = self.client.post(
            self.url,
            {"file": excel_file, "upload_type": "student"},
            HTTP_AUTHORIZATION=f"Bearer {self.token_teacher_a}"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["created"], 1)
        self.assertEqual(response.data["failed"], 0)
        self.assertTrue(User.objects.filter(username="student_new_1").exists())
        self.assertTrue(Student.objects.filter(user__username="student_new_1", school=self.school_a).exists())

    def test_school_admin_upload_teachers_and_students_allowed(self):
        # 1. School Admin uploads teachers
        excel_file_teacher = create_mock_excel(
            ["username", "password", "qualification", "experience_years"],
            [["teacher_new_1", "SecurePass@123", "M.A. English", "8"]]
        )
        response_t = self.client.post(
            self.url,
            {"file": excel_file_teacher, "upload_type": "teacher"},
            HTTP_AUTHORIZATION=f"Bearer {self.token_admin_a}"
        )
        self.assertEqual(response_t.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response_t.data["created"], 1)
        self.assertTrue(Teacher.objects.filter(user__username="teacher_new_1", school=self.school_a).exists())

        # 2. School Admin uploads students
        excel_file_student = create_mock_excel(
            ["username", "password"],
            [["student_new_2", "SecurePass@123"]]
        )
        response_s = self.client.post(
            self.url,
            {"file": excel_file_student, "upload_type": "student"},
            HTTP_AUTHORIZATION=f"Bearer {self.token_admin_a}"
        )
        self.assertEqual(response_s.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response_s.data["created"], 1)
        self.assertTrue(Student.objects.filter(user__username="student_new_2", school=self.school_a).exists())

    def test_invalid_file_infrastructure_rejected(self):
        # 1. Invalid file extension
        invalid_file = io.BytesIO(b"dummy text")
        invalid_file.name = "data.txt"
        response_ext = self.client.post(
            self.url,
            {"file": invalid_file, "upload_type": "student"},
            HTTP_AUTHORIZATION=f"Bearer {self.token_admin_a}"
        )
        self.assertEqual(response_ext.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only .xlsx and .xls are supported", response_ext.data["error"])

        # 2. Missing username or password header
        invalid_headers_file = create_mock_excel(["invalid_header", "invalid_pass"], [["u1", "p1"]])
        invalid_headers_file.name = "data.xlsx"
        response_hdr = self.client.post(
            self.url,
            {"file": invalid_headers_file, "upload_type": "student"},
            HTTP_AUTHORIZATION=f"Bearer {self.token_admin_a}"
        )
        self.assertEqual(response_hdr.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Must include 'username'", response_hdr.data["error"])

    def test_school_tenant_isolation_enforcement(self):
        # School Admin A tries to link a new teacher to Class B (which belongs to School B)
        excel_file = create_mock_excel(
            ["username", "password", "class_id"],
            [["t_isolated_1", "SecurePass@123", self.class_b.class_id]]
        )
        excel_file.name = "data.xlsx"
        response = self.client.post(
            self.url,
            {"file": excel_file, "upload_type": "teacher"},
            HTTP_AUTHORIZATION=f"Bearer {self.token_admin_a}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK) # Row failed, but API finished OK
        self.assertEqual(response.data["created"], 0)
        self.assertEqual(response.data["failed"], 1)
        self.assertIn("does not exist or does not belong to this school", response.data["errors"][0]["error"])
        
        # Verify no orphan user created
        self.assertFalse(User.objects.filter(username="t_isolated_1").exists())

    def test_partial_success_and_transaction_rollback(self):
        # Create an existing user to trigger duplicate username error on Row 3
        User.objects.create_user(username="t_duplicate", password="SecurePass@123", role="TEACHER")

        # Row 2: Valid
        # Row 3: Duplicate username (Fails)
        # Row 4: Weak password (Fails)
        # Row 5: Valid
        excel_file = create_mock_excel(
            ["username", "password"],
            [
                ["t_valid_1", "SecurePass@123"],
                ["t_duplicate", "SecurePass@123"],
                ["t_weak", "123"],
                ["t_valid_2", "SecurePass@123"]
            ]
        )
        excel_file.name = "data.xlsx"
        response = self.client.post(
            self.url,
            {"file": excel_file, "upload_type": "teacher"},
            HTTP_AUTHORIZATION=f"Bearer {self.token_admin_a}"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["created"], 2)
        self.assertEqual(response.data["failed"], 2)
        self.assertEqual(len(response.data["errors"]), 2)
        
        # Check rows in errors mapping
        self.assertEqual(response.data["errors"][0]["row"], 3)
        self.assertEqual(response.data["errors"][1]["row"], 4)
        
        # Verify valid users exist and failed users do not exist
        self.assertTrue(User.objects.filter(username="t_valid_1").exists())
        self.assertTrue(User.objects.filter(username="t_valid_2").exists())
        self.assertFalse(User.objects.filter(username="t_weak").exists())

    def test_super_admin_bypass_and_school_id_requirement(self):
        # 1. Super Admin upload without school_id (Fails)
        excel_file = create_mock_excel(["username", "password"], [["t_super_1", "SecurePass@123"]])
        excel_file.name = "data.xlsx"
        response_fail = self.client.post(
            self.url,
            {"file": excel_file, "upload_type": "teacher"},
            HTTP_AUTHORIZATION=f"Bearer {self.token_super}"
        )
        self.assertEqual(response_fail.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("school_id is required", response_fail.data["error"])

        # 2. Super Admin upload with school_id (Succeeds)
        excel_file.seek(0)
        response_success = self.client.post(
            self.url,
            {
                "file": excel_file,
                "upload_type": "teacher",
                "school_id": self.school_a.school_id
            },
            HTTP_AUTHORIZATION=f"Bearer {self.token_super}"
        )
        self.assertEqual(response_success.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response_success.data["created"], 1)
        self.assertTrue(Teacher.objects.filter(user__username="t_super_1", school=self.school_a).exists())

    def test_school_bulk_upload_success(self):
        headers = ["schoolname", "email", "password", "admin name", "location"]
        rows = [
            ["St. Mary's Academy", "admin1@stmarys.com", "SecurePass@123", "Sister Agnes", "Boston, MA"],
            ["Oakwood High", "admin2@oakwood.com", "SecurePass@123", "Mr. John Doe", "Chicago, IL"]
        ]
        excel_file = create_mock_excel(headers, rows)
        excel_file.name = "schools.xlsx"
        
        response = self.client.post(
            self.url,
            {
                "file": excel_file,
                "upload_type": "school"
            },
            HTTP_AUTHORIZATION=f"Bearer {self.token_super}"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["created"], 2)
        self.assertEqual(response.data["failed"], 0)
        
        school1 = School.objects.get(school_name="St. Mary's Academy")
        self.assertEqual(school1.address, "Boston, MA")
        self.assertEqual(school1.email, "admin1@stmarys.com")
        
        user1 = User.objects.get(email="admin1@stmarys.com")
        self.assertEqual(user1.username, "admin1")
        self.assertEqual(user1.role, "SCHOOL_ADMIN")
        self.assertEqual(user1.full_name, "Sister Agnes")
        self.assertTrue(SchoolAdminProfile.objects.filter(user=user1, school=school1).exists())
        
        school2 = School.objects.get(school_name="Oakwood High")
        user2 = User.objects.get(email="admin2@oakwood.com")
        self.assertEqual(user2.username, "admin2")
        self.assertEqual(user2.role, "SCHOOL_ADMIN")
        self.assertEqual(user2.full_name, "Mr. John Doe")
        self.assertTrue(SchoolAdminProfile.objects.filter(user=user2, school=school2).exists())

    def test_school_bulk_upload_access_denied_for_non_super_admin(self):
        headers = ["schoolname", "email", "password", "admin name", "location"]
        rows = [["Test School", "admin@test.com", "SecurePass@123", "Admin User", "Test City"]]
        excel_file = create_mock_excel(headers, rows)
        excel_file.name = "schools.xlsx"
        
        response1 = self.client.post(
            self.url,
            {"file": excel_file, "upload_type": "school"},
            HTTP_AUTHORIZATION=f"Bearer {self.token_admin_a}"
        )
        self.assertEqual(response1.status_code, status.HTTP_403_FORBIDDEN)
        
        excel_file.seek(0)
        response2 = self.client.post(
            self.url,
            {"file": excel_file, "upload_type": "school"},
            HTTP_AUTHORIZATION=f"Bearer {self.token_teacher_a}"
        )
        self.assertEqual(response2.status_code, status.HTTP_403_FORBIDDEN)

    def test_school_bulk_upload_missing_headers(self):
        headers = ["schoolname", "email", "password", "admin name"]
        rows = [["Test School", "admin@test.com", "SecurePass@123", "Admin User"]]
        excel_file = create_mock_excel(headers, rows)
        excel_file.name = "schools.xlsx"
        
        response = self.client.post(
            self.url,
            {"file": excel_file, "upload_type": "school"},
            HTTP_AUTHORIZATION=f"Bearer {self.token_super}"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Missing required column header", response.data["error"])
