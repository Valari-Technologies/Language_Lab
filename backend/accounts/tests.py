from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class RoleBasedLoginTests(TestCase):
    """
    Test suite for role-based authentication and restricted user access.
    """
    def setUp(self):
        # Create users for each of the four roles
        self.super_admin = User.objects.create_user(
            username="super_admin",
            password="password123",
            email="super@example.com",
            role="SUPER_ADMIN",
            full_name="Super Admin"
        )
        self.institute_admin = User.objects.create_user(
            username="institute_admin",
            password="password123",
            email="institute@example.com",
            role="INSTITUTE_ADMIN",
            full_name="Institute Admin"
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

    def test_admin_login_super_admin_success(self):
        url = reverse("admin_login")
        data = {"username": "super_admin", "password": "password123"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["username"], "super_admin")
        self.assertEqual(response.data["user"]["role"], "SUPER_ADMIN")

    def test_admin_login_institute_admin_success(self):
        url = reverse("admin_login")
        data = {"username": "institute_admin", "password": "password123"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["user"]["role"], "INSTITUTE_ADMIN")

    def test_admin_login_teacher_success(self):
        url = reverse("admin_login")
        data = {"username": "teacher", "password": "password123"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["user"]["role"], "TEACHER")

    def test_admin_login_student_blocked(self):
        url = reverse("admin_login")
        data = {"username": "student", "password": "password123"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["message"], "Students are not allowed to log in through this portal.")

    def test_admin_login_role_matching_success(self):
        url = reverse("admin_login")
        data = {"username": "teacher", "password": "password123", "role": "TEACHER"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["role"], "TEACHER")

    def test_admin_login_role_mismatch_blocked(self):
        url = reverse("admin_login")
        data = {"username": "teacher", "password": "password123", "role": "SUPER_ADMIN"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["message"], "You are not authorized to log in as Super Admin.")

    def test_admin_login_invalid_credentials(self):
        url = reverse("admin_login")
        data = {"username": "super_admin", "password": "wrongpassword"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["message"], "Invalid username or password.")

    def test_student_login_success(self):
        url = reverse("student_login")
        data = {"username": "student", "password": "password123"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["user"]["username"], "student")
        self.assertEqual(response.data["user"]["role"], "STUDENT")

    def test_student_login_admin_blocked(self):
        url = reverse("student_login")
        data = {"username": "super_admin", "password": "password123"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["message"], "Only students are allowed to log in through this portal.")

    def test_student_login_teacher_blocked(self):
        url = reverse("student_login")
        data = {"username": "teacher", "password": "password123"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["message"], "Only students are allowed to log in through this portal.")

    def test_registration_by_super_admin_success(self):
        url = reverse("register")
        data = {
            "username": "new_teacher",
            "password": "securepassword123",
            "email": "new_teacher@example.com",
            "role": "TEACHER",
            "full_name": "New Teacher"
        }
        # Obtain JWT Token for Super Admin
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
        # Obtain JWT Token for Teacher
        token = RefreshToken.for_user(self.teacher).access_token
        response = self.client.post(
            url, data, format="json", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_registration_unauthenticated_blocked(self):
        url = reverse("register")
        data = {
            "username": "unauth_user",
            "password": "securepassword123",
            "email": "unauth@example.com",
            "role": "STUDENT"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
