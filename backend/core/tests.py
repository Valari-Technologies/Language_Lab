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
        url = "/api/cms/school-admins/"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        self.assertTrue(len(results) >= 1)
        self.assertEqual(results[0]["username"], "school_admin_test")

    def test_update_school_admin(self):
        url = f"/api/cms/school-admins/{self.school_admin.id}/"
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
        url = f"/api/cms/school-admins/{self.school_admin.id}/"
        response = self.client.delete(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify deleted
        self.assertFalse(User.objects.filter(id=self.school_admin.id).exists())

    def test_update_teacher_with_user_details(self):
        url = f"/api/cms/teachers/{self.teacher.teacher_id}/"
        data = {
            "school": self.school.school_id,
            "qualification": "M.A. English literature",
            "experience_years": 5,
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
        self.assertEqual(self.teacher.experience_years, 5)

        # Verify linked user fields updated
        self.teacher_user.refresh_from_db()
        self.assertEqual(self.teacher_user.full_name, "Updated Teacher Name")
        self.assertEqual(self.teacher_user.email, "updatedteacher@testschool.edu")
        self.assertFalse(self.teacher_user.is_active)

    def test_delete_teacher(self):
        url = f"/api/cms/teachers/{self.teacher.teacher_id}/"
        response = self.client.delete(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify teacher deleted
        self.assertFalse(Teacher.objects.filter(teacher_id=self.teacher.teacher_id).exists())

    def test_create_school_admin(self):
        url = "/api/cms/school-admins/"
        data = {
            "username": "new_school_admin",
            "password": "newpassword123",
            "email": "newadmin@school.edu",
            "full_name": "New School Admin",
            "is_active": True
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
        url = "/api/cms/teachers/"
        data = {
            "username": "new_teacher_user",
            "password": "newpassword123",
            "email": "newteacher@school.edu",
            "full_name": "New Teacher Name",
            "is_active": True,
            "school": self.school.school_id,
            "qualification": "Ph.D. in Linguistics",
            "experience_years": 10
        }
        response = self.client.post(
            url, data, content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {self.token}"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="new_teacher_user").exists())
        user = User.objects.get(username="new_teacher_user")
        self.assertTrue(user.check_password("newpassword123"))
        self.assertEqual(user.role, "TEACHER")
        self.assertTrue(Teacher.objects.filter(user=user).exists())
        t = Teacher.objects.get(user=user)
        self.assertEqual(t.qualification, "Ph.D. in Linguistics")
        self.assertEqual(t.experience_years, 10)
