from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()

class RoleBasedLoginTests(TestCase):
    def setUp(self):
        # Create users for each role
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
            email="school@example.com",
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

    def test_cms_login_success(self):
        url = reverse("cms_login")
        data = {"username": "super_admin", "password": "password123"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Login successful")
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["username"], "super_admin")
        self.assertEqual(response.data["user"]["role"], "SUPER_ADMIN")
        self.assertEqual(response.data["user"]["full_name"], "Super Admin")

    def test_cms_login_incorrect_role(self):
        url = reverse("cms_login")
        # school_admin tries to login to CMS admin portal
        data = {"username": "school_admin", "password": "password123"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data, {"message": "Only Super Admin can access the CMS."})

    def test_cms_login_invalid_credentials(self):
        url = reverse("cms_login")
        data = {"username": "super_admin", "password": "wrongpassword"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data, {"message": "Invalid username or password."})

    def test_common_login_school_admin_success(self):
        url = reverse("common_login")
        data = {"username": "school_admin", "password": "password123", "role": "SCHOOL_ADMIN"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Login successful")
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["username"], "school_admin")
        self.assertEqual(response.data["user"]["role"], "SCHOOL_ADMIN")
        self.assertEqual(response.data["user"]["full_name"], "School Admin")

    def test_common_login_teacher_success(self):
        url = reverse("common_login")
        data = {"username": "teacher", "password": "password123", "role": "TEACHER"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Login successful")
        self.assertEqual(response.data["user"]["username"], "teacher")
        self.assertEqual(response.data["user"]["role"], "TEACHER")

    def test_common_login_student_success(self):
        url = reverse("common_login")
        data = {"username": "student", "password": "password123", "role": "STUDENT"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Login successful")
        self.assertEqual(response.data["user"]["username"], "student")
        self.assertEqual(response.data["user"]["role"], "STUDENT")

    def test_common_login_incorrect_role(self):
        url = reverse("common_login")
        # teacher tries to login as STUDENT
        data = {"username": "teacher", "password": "password123", "role": "STUDENT"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data, {"message": "You are not authorized to access this portal."})

    def test_common_login_invalid_credentials(self):
        url = reverse("common_login")
        data = {"username": "student", "password": "wrongpassword", "role": "STUDENT"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data, {"message": "Invalid username or password."})

    def test_common_login_missing_role(self):
        url = reverse("common_login")
        data = {"username": "student", "password": "password123"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", response.data)

    def test_common_login_invalid_role_choice(self):
        url = reverse("common_login")
        # SUPER_ADMIN is not in choice list of CommonLoginSerializer
        data = {"username": "super_admin", "password": "password123", "role": "SUPER_ADMIN"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", response.data)


