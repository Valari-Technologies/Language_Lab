from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

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
        self.assertEqual(response.data["school_name"], "St. Mary's English Academy")

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
