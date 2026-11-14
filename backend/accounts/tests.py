from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from super_admin.models import Grade, School, SchoolAdminProfile
from school_admin.models import Class, Teacher, TeacherClass

User = get_user_model()


class RoleBasedLoginTests(TestCase):
    """
    Test suite for unified login authentication and role-based dashboard authorization.
    """
    def setUp(self):
        # Create users for each of the roles
        self.super_admin = User.objects.create_user(
            username="super_admin",
            password="password123",
            email="super@example.com",
            role="SUPER_ADMIN",
            full_name="Super Admin"
        )
        self.school_admin = User.objects.create_user(
            username="school_admin",
            password="password123",
            email="institute@example.com",
            role="SCHOOL_ADMIN",
            full_name="School Admin"
        )
        self.teacher = User.objects.create_user(
            username="teacher",
            password="password123",
            email="teacher@example.com",
            role="TEACHER",
            full_name="Teacher User"
        )
        self.student = User.objects.create_user(
            username="student",
            password="password123",
            email="student@example.com",
            role="STUDENT",
            full_name="Student User"
        )

        # Link school_admin/teacher to a real school so their dashboards resolve.
        self.school = School.objects.create(
            school_name="Test Dashboard School",
            address="1 Test St",
            phone="555-0100",
            email="dashboard-school@example.com",
        )
        SchoolAdminProfile.objects.create(user=self.school_admin, school=self.school)
        self.teacher_profile = Teacher.objects.create(user=self.teacher, school=self.school)
        self.grade = Grade.objects.create(grade_name="Test Grade", sort_order=1)
        self.class_obj = Class.objects.create(
            school=self.school, class_name="Class 6-A", grade=self.grade, academic_year="2026",
        )
        TeacherClass.objects.create(teacher=self.teacher_profile, class_obj=self.class_obj)

    def test_login_super_admin_success(self):
        url = reverse("login")
        data = {"username": "super_admin", "password": "password123"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["message"], "Login successful")
        self.assertEqual(response.data["user"]["username"], "super_admin")
        self.assertEqual(response.data["user"]["role"], "SUPER_ADMIN")

    def test_login_school_admin_success_maps_to_school_admin(self):
        url = reverse("login")
        data = {"username": "school_admin", "password": "password123"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["role"], "SCHOOL_ADMIN")

    def test_login_teacher_success(self):
        url = reverse("login")
        data = {"username": "teacher", "password": "password123"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["role"], "TEACHER")

    def test_login_by_email_success(self):
        url = reverse("login")
        data = {"username": "teacher@example.com", "password": "password123"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["role"], "TEACHER")
        self.assertEqual(response.data["user"]["username"], "teacher")

    def test_login_student_success(self):
        url = reverse("login")
        data = {"username": "student", "password": "password123"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["message"], "Access denied. This portal is for administrators and teachers only.")

    def test_login_invalid_credentials(self):
        url = reverse("login")
        data = {"username": "super_admin", "password": "wrongpassword"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["message"], "Invalid username or password")

    def test_login_missing_fields(self):
        url = reverse("login")
        data = {"username": "super_admin"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Authorization checks for school/dashboard/ endpoint
    def test_school_dashboard_authorized_for_school_admin(self):
        url = reverse("school_dashboard")
        token = RefreshToken.for_user(self.school_admin).access_token
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["school_name"], self.school.school_name)
        self.assertEqual(response.data["total_teachers"], 1)
        self.assertEqual(response.data["active_classes"], 1)

    def test_school_dashboard_denied_for_teacher_and_others(self):
        url = reverse("school_dashboard")
        
        # Teacher denied
        token = RefreshToken.for_user(self.teacher).access_token
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Super admin denied
        token = RefreshToken.for_user(self.super_admin).access_token
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Authorization checks for teacher/dashboard/ endpoint
    def test_teacher_dashboard_authorized_for_teacher(self):
        url = reverse("teacher_dashboard")
        token = RefreshToken.for_user(self.teacher).access_token
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Class 6-A", response.data["assigned_classes"])
        self.assertEqual(response.data["grading_queue_count"], 0)
        self.assertEqual(response.data["student_rankings"], [])

    def test_teacher_dashboard_denied_for_school_admin_and_others(self):
        url = reverse("teacher_dashboard")
        
        # School admin denied
        token = RefreshToken.for_user(self.school_admin).access_token
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Super admin denied
        token = RefreshToken.for_user(self.super_admin).access_token
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test registration access
    def test_registration_by_super_admin_success(self):
        url = reverse("register")
        data = {
            "username": "new_teacher",
            "password": "securepassword123",
            "email": "new_teacher@example.com",
            "role": "TEACHER",
            "full_name": "New Teacher"
        }
        token = RefreshToken.for_user(self.super_admin).access_token
        response = self.client.post(
            url, data, format="json", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["message"], "User registered successfully.")
        self.assertEqual(response.data["user"]["username"], "new_teacher")
        self.assertEqual(response.data["user"]["role"], "TEACHER")

    def test_registration_by_teacher_blocked(self):
        url = reverse("register")
        data = {
            "username": "another_student",
            "password": "securepassword123",
            "email": "another@example.com",
            "role": "STUDENT"
        }
        token = RefreshToken.for_user(self.teacher).access_token
        response = self.client.post(
            url, data, format="json", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ProfileAndPasswordTests(TestCase):
    """
    Test suite for the logged-in user's own profile view/update and password change.
    """
    def setUp(self):
        self.user = User.objects.create_user(
            username="profile_user",
            password="OriginalPass123",
            email="original@example.com",
            role="TEACHER",
            full_name="Original Name"
        )
        self.token = RefreshToken.for_user(self.user).access_token

    def test_get_profile_requires_authentication(self):
        url = reverse("user-profile")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_profile_returns_current_user(self):
        url = reverse("user-profile")
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "profile_user")
        self.assertEqual(response.data["email"], "original@example.com")
        self.assertEqual(response.data["full_name"], "Original Name")

    def test_update_profile_full_name_and_email(self):
        url = reverse("user-profile")
        data = {"full_name": "Updated Name", "email": "updated@example.com"}
        response = self.client.put(
            url, data, content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {self.token}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.full_name, "Updated Name")
        self.assertEqual(self.user.email, "updated@example.com")

    def test_update_profile_cannot_change_username_or_role(self):
        url = reverse("user-profile")
        data = {"username": "hijacked_username", "role": "SUPER_ADMIN"}
        response = self.client.put(
            url, data, content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {self.token}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "profile_user")
        self.assertEqual(self.user.role, "TEACHER")

    def test_change_password_success(self):
        url = reverse("change-password")
        data = {"old_password": "OriginalPass123", "new_password": "BrandNewPass456"}
        response = self.client.post(
            url, data, content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {self.token}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("BrandNewPass456"))

    def test_change_password_wrong_old_password_rejected(self):
        url = reverse("change-password")
        data = {"old_password": "WrongPassword", "new_password": "BrandNewPass456"}
        response = self.client.post(
            url, data, content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {self.token}"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("OriginalPass123"))

    def test_change_password_weak_new_password_rejected(self):
        url = reverse("change-password")
        data = {"old_password": "OriginalPass123", "new_password": "12345"}
        response = self.client.post(
            url, data, content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {self.token}"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("OriginalPass123"))

    def test_change_password_requires_authentication(self):
        url = reverse("change-password")
        data = {"old_password": "OriginalPass123", "new_password": "BrandNewPass456"}
        response = self.client.post(url, data, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from super_admin.models import School
from school_admin.models import Teacher

User = get_user_model()

class CMSSchoolAdminAndTeacherTests(TestCase):
    def setUp(self):
        # Create a Super Admin for auth
        self.super_admin = User.objects.create_user(
            username="super_admin",
            password="password123",
            email="super@example.com",
            role="SUPER_ADMIN",
            full_name="Super Admin"
        )
        self.token = RefreshToken.for_user(self.super_admin).access_token

        # Create a School Admin to test CRUD
        self.school_admin = User.objects.create_user(
            username="school_admin_test",
            password="password123",
            email="admin@testschool.edu",
            role="SCHOOL_ADMIN",
            full_name="Test School Admin",
            is_active=True
        )

        # Create a school
        self.school = School.objects.create(
            school_name="Greenwood High",
            address="123 Pine St",
            phone="555-0199",
            email="greenwood@edu.com",
            is_active=True
        )

        # Create a Teacher User
        self.teacher_user = User.objects.create_user(
            username="teacher_test",
            password="password123",
            email="teacher@testschool.edu",
            role="TEACHER",
            full_name="Test Teacher",
            is_active=True
        )
        # Create a Teacher profile
        self.teacher = Teacher.objects.create(
            user=self.teacher_user,
            school=self.school,
            qualification="B.A. English",
            experience_years=3
        )

    def test_list_school_admins(self):
        url = "/api/cms/v1/school-admins/"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        self.assertTrue(len(results) >= 1)
        self.assertEqual(results[0]["username"], "school_admin_test")

    def test_update_school_admin(self):
        url = f"/api/cms/v1/school-admins/{self.school_admin.id}/"
        data = {
            "full_name": "Updated School Admin Name",
            "email": "updatedadmin@testschool.edu",
            "is_active": False
        }
        response = self.client.put(
            url, data, content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {self.token}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Reload from DB and verify
        self.school_admin.refresh_from_db()
        self.assertEqual(self.school_admin.full_name, "Updated School Admin Name")
        self.assertEqual(self.school_admin.email, "updatedadmin@testschool.edu")
        self.assertFalse(self.school_admin.is_active)

    def test_delete_school_admin(self):
        url = f"/api/cms/v1/school-admins/{self.school_admin.id}/"
        response = self.client.delete(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify deleted
        self.assertFalse(User.objects.filter(id=self.school_admin.id).exists())

    def test_update_teacher_with_user_details(self):
        url = f"/api/cms/v1/teachers/{self.teacher.teacher_id}/"
        data = {
            "school": self.school.school_id,
            "qualification": "M.A. English literature",
            "full_name": "Updated Teacher Name",
            "email": "updatedteacher@testschool.edu",
            "is_active": False
        }
        response = self.client.put(
            url, data, content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {self.token}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify teacher fields updated
        self.teacher.refresh_from_db()
        self.assertEqual(self.teacher.qualification, "M.A. English literature")

        # Verify linked user fields updated
        self.teacher_user.refresh_from_db()
        self.assertEqual(self.teacher_user.full_name, "Updated Teacher Name")
        self.assertEqual(self.teacher_user.email, "updatedteacher@testschool.edu")
        self.assertFalse(self.teacher_user.is_active)

    def test_delete_teacher(self):
        url = f"/api/cms/v1/teachers/{self.teacher.teacher_id}/"
        response = self.client.delete(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify teacher deleted
        self.assertFalse(Teacher.objects.filter(teacher_id=self.teacher.teacher_id).exists())

    def test_create_school_admin(self):
        url = "/api/cms/v1/school-admins/"
        data = {
            "username": "new_school_admin",
            "password": "newpassword123",
            "email": "newadmin@school.edu",
            "full_name": "New School Admin",
            "is_active": True,
            "school": self.school.school_id
        }
        response = self.client.post(
            url, data, content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {self.token}"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="new_school_admin").exists())
        user = User.objects.get(username="new_school_admin")
        self.assertTrue(user.check_password("newpassword123"))
        self.assertEqual(user.role, "SCHOOL_ADMIN")

    def test_create_teacher_profile(self):
        url = "/api/cms/v1/teachers/"
        data = {
            "email": "newteacher@school.edu",
            "full_name": "New Teacher Name",
            "is_active": True,
            "school": self.school.school_id,
            "qualification": "Ph.D. in Linguistics",
        }
        response = self.client.post(
            url, data, content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {self.token}"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="newteacher@school.edu").exists())
        user = User.objects.get(username="newteacher@school.edu")
        self.assertTrue(user.check_password("Teacher123!"))
        self.assertEqual(user.role, "TEACHER")
        self.assertTrue(Teacher.objects.filter(user=user).exists())
        t = Teacher.objects.get(user=user)
        self.assertEqual(t.qualification, "Ph.D. in Linguistics")


from accounts.models import PasswordResetOTP
from django.core import mail
from django.utils import timezone
from datetime import timedelta


class ForgotPasswordTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="reset_test_user",
            password="testpassword123",
            email="reset_test@example.com",
            role="TEACHER",
            full_name="Reset Test User"
        )
        self.forgot_url = reverse("forgot-password")
        self.reset_url = reverse("reset-password")

    def test_forgot_password_email_not_found(self):
        data = {"email": "nonexistent@example.com"}
        response = self.client.post(self.forgot_url, data, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("No active user found", response.data["message"])

    def test_forgot_password_success(self):
        # Empty outbox
        mail.outbox = []
        data = {"email": "reset_test@example.com"}
        response = self.client.post(self.forgot_url, data, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("successfully", response.data["message"])

        # Check DB
        otp_record = PasswordResetOTP.objects.filter(email="reset_test@example.com").first()
        self.assertIsNotNone(otp_record)
        self.assertEqual(len(otp_record.otp_code), 6)
        self.assertFalse(otp_record.is_verified)

        # Check email sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["reset_test@example.com"])
        self.assertIn(otp_record.otp_code, mail.outbox[0].body)

    def test_reset_password_invalid_otp(self):
        # Create OTP
        PasswordResetOTP.objects.create(
            email="reset_test@example.com",
            otp_code="123456",
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        data = {
            "email": "reset_test@example.com",
            "otp_code": "000000",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123"
        }
        response = self.client.post(self.reset_url, data, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid or expired OTP", response.data["message"])

    def test_reset_password_expired_otp(self):
        # Create expired OTP
        PasswordResetOTP.objects.create(
            email="reset_test@example.com",
            otp_code="123456",
            expires_at=timezone.now() - timedelta(minutes=1)
        )
        data = {
            "email": "reset_test@example.com",
            "otp_code": "123456",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123"
        }
        response = self.client.post(self.reset_url, data, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid or expired OTP", response.data["message"])

    def test_reset_password_mismatched_passwords(self):
        data = {
            "email": "reset_test@example.com",
            "otp_code": "123456",
            "new_password": "newpassword123",
            "confirm_password": "differentpassword"
        }
        response = self.client.post(self.reset_url, data, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_password_success(self):
        # Create valid OTP
        otp_record = PasswordResetOTP.objects.create(
            email="reset_test@example.com",
            otp_code="123456",
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        data = {
            "email": "reset_test@example.com",
            "otp_code": "123456",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123"
        }
        response = self.client.post(self.reset_url, data, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("successfully", response.data["message"])

        # Check DB
        otp_record.refresh_from_db()
        self.assertTrue(otp_record.is_verified)

        # Check password reset
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpassword123"))

    def test_verify_otp_valid(self):
        PasswordResetOTP.objects.create(
            email="reset_test@example.com",
            otp_code="654321",
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        url = reverse("verify-otp")
        data = {"email": "reset_test@example.com", "otp_code": "654321"}
        response = self.client.post(url, data, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["valid"])

    def test_verify_otp_invalid(self):
        url = reverse("verify-otp")
        data = {"email": "reset_test@example.com", "otp_code": "000000"}
        response = self.client.post(url, data, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["valid"])


class ProfileSettingsValidationTests(TestCase):
    """
    Tests for Profile Settings:
    - Mandatory email & phone number (10 digits)
    - School Admin updating school_name directly syncs to the School model
    """
    def setUp(self):
        from rest_framework.test import APIClient
        self.client = APIClient()
        self.school = School.objects.create(
            school_name="Original School Name",
            address="123 Test St",
            phone="9876543210",
            email="school@test.edu"
        )
        self.school_admin = User.objects.create_user(
            username="admin_user",
            password="Password@123",
            email="admin@test.edu",
            phone_no="9876543210",
            full_name="John Doe Admin",
            role=User.Role.SCHOOL_ADMIN
        )
        SchoolAdminProfile.objects.create(user=self.school_admin, school=self.school)
        self.profile_url = reverse("user-profile")

    def test_profile_update_fails_without_email(self):
        token = str(RefreshToken.for_user(self.school_admin).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.patch(
            self.profile_url,
            {"full_name": "John Doe", "email": "", "phone_no": "9876543210"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_profile_update_fails_without_valid_phone(self):
        token = str(RefreshToken.for_user(self.school_admin).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        # Empty phone
        response = self.client.patch(
            self.profile_url,
            {"full_name": "John Doe", "email": "valid@test.edu", "phone_no": ""},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone_no", response.data)

        # Invalid phone length
        response = self.client.patch(
            self.profile_url,
            {"full_name": "John Doe", "email": "valid@test.edu", "phone_no": "12345"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone_no", response.data)

    def test_profile_update_success_and_syncs_school_name(self):
        token = str(RefreshToken.for_user(self.school_admin).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.patch(
            self.profile_url,
            {
                "full_name": "Updated Admin Name",
                "email": "updated_admin@test.edu",
                "phone_no": "9123456789",
                "school_name": "Bolleni International School"
            },
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify user was updated
        self.school_admin.refresh_from_db()
        self.assertEqual(self.school_admin.full_name, "Updated Admin Name")
        self.assertEqual(self.school_admin.email, "updated_admin@test.edu")
        self.assertEqual(self.school_admin.phone_no, "9123456789")

        # Verify school was updated
        self.school.refresh_from_db()
        self.assertEqual(self.school.school_name, "Bolleni International School")
        self.assertEqual(self.school.schoolAdminId, self.school_admin)


class DeactivatedUserLoginTests(TestCase):
    """
    Tests for login behavior when an account (e.g. Teacher) is deactivated.
    Ensures HTTP 403 with appropriate 'Access denied' message is returned instead of 'Invalid username or password'.
    """
    def setUp(self):
        from rest_framework.test import APIClient
        self.client = APIClient()
        self.school = School.objects.create(
            school_name="Greenwood High School",
            address="456 Academic Way",
            phone="9876543210",
            email="info@greenwood.edu",
            is_active=True
        )
        self.teacher_user = User.objects.create_user(
            username="madhu_teacher",
            email="Madhu@gmail.com",
            password="password123",
            full_name="Madhu Teacher",
            role=User.Role.TEACHER,
            is_active=False  # Deactivated teacher account
        )
        Teacher.objects.create(user=self.teacher_user, school=self.school)
        self.login_url = reverse("login")

    def test_deactivated_teacher_login_by_email_returns_access_denied(self):
        response = self.client.post(
            self.login_url,
            {"username": "Madhu@gmail.com", "password": "password123"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Access denied", response.data.get("message", ""))
        self.assertIn("deactivated", response.data.get("message", "").lower())

    def test_deactivated_teacher_login_by_username_returns_access_denied(self):
        response = self.client.post(
            self.login_url,
            {"username": "madhu_teacher", "password": "password123"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Access denied", response.data.get("message", ""))
        self.assertIn("deactivated", response.data.get("message", "").lower())

    def test_active_teacher_invalid_password_returns_401(self):
        self.teacher_user.is_active = True
        self.teacher_user.save()

        response = self.client.post(
            self.login_url,
            {"username": "Madhu@gmail.com", "password": "wrongpassword"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data.get("message"), "Invalid username or password")




