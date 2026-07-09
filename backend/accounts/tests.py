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

    def test_login_student_success(self):
        url = reverse("login")
        data = {"username": "student", "password": "password123"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["role"], "STUDENT")

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
