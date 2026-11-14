from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from school_admin.models import Teacher
from super_admin.models import License, LmsServer, School, SchoolAdminProfile

User = get_user_model()
URL = "/api/hub/admin/verify/"
PASSWORD = "Secret#Pass123"


class HubAdminVerifyAPITestCase(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        future = timezone.now().date() + timedelta(days=365)
        self.school_a = School.objects.create(
            schoolId="SCH-A", school_name="School A", address="1 Main St", phone="100", email="a@school.test"
        )
        self.school_b = School.objects.create(
            schoolId="SCH-B", school_name="School B", address="2 Main St", phone="200", email="b@school.test"
        )
        lic_a = License.objects.create(licenseId="LIC-A", licenseKey="KEY-A", school=self.school_a, expiryDate=future)
        lic_b = License.objects.create(licenseId="LIC-B", licenseKey="KEY-B", school=self.school_b, expiryDate=future)
        LmsServer.objects.create(installationId="INST-A1", serverName="Hub A1", licenseKey="LMS-KEY-A1", school=self.school_a, license=lic_a)
        LmsServer.objects.create(installationId="INST-A2", serverName="Hub A2", licenseKey="LMS-KEY-A2", school=self.school_a, license=lic_a)
        LmsServer.objects.create(installationId="INST-B1", serverName="Hub B1", licenseKey="LMS-KEY-B1", school=self.school_b, license=lic_b)

        self.admin_a = self._user("admin_a", "Admin.A@school.test", User.Role.SCHOOL_ADMIN, full_name="Admin A")
        SchoolAdminProfile.objects.create(user=self.admin_a, school=self.school_a)
        self.admin_b = self._user("admin_b", "admin.b@school.test", User.Role.SCHOOL_ADMIN)
        SchoolAdminProfile.objects.create(user=self.admin_b, school=self.school_b)
        self.admin_inactive = self._user("admin_off", "off@school.test", User.Role.SCHOOL_ADMIN, is_active=False)
        SchoolAdminProfile.objects.create(user=self.admin_inactive, school=self.school_a)
        self.admin_no_profile = self._user("admin_np", "np@school.test", User.Role.SCHOOL_ADMIN)
        self.teacher_a = self._user("teach_a", "teach@school.test", User.Role.TEACHER)
        Teacher.objects.create(user=self.teacher_a, school=self.school_a)

    def _user(self, username, email, role, **extra):
        return User.objects.create_user(username=username, email=email, password=PASSWORD, role=role, **extra)

    def _verify(self, email, password=PASSWORD, installation="INST-A1", school="SCH-A", license_id="LIC-A"):
        return self.client.post(
            URL, {"email": email, "password": password}, format="json",
            HTTP_X_SCHOOL_ID=school, HTTP_X_LICENSE_ID=license_id, HTTP_X_INSTALLATION_ID=installation,
        )

    def test_school_admin_of_hub_school_ok(self):
        response = self._verify("admin.a@SCHOOL.test")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {
            "ok": True,
            "admin": {"username": "admin_a", "email": "Admin.A@school.test", "full_name": "Admin A"},
            "school": {"schoolId": "SCH-A", "name": "School A"},
        })
        for token_key in ("access", "refresh", "token", "tokens"):
            self.assertNotIn(token_key, response.data)

    def test_login_by_username(self):
        self.assertEqual(self._verify("ADMIN_A").status_code, status.HTTP_200_OK)

    def test_wrong_password_and_unknown_email_same_401(self):
        wrong_password = self._verify("admin.a@school.test", password="nope")
        unknown = self._verify("nobody@school.test")
        self.assertEqual(wrong_password.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(unknown.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(wrong_password.data, {"error": "invalid_credentials"})
        self.assertEqual(unknown.data, wrong_password.data)

    def test_not_school_admin(self):
        for email in ("teach@school.test", "off@school.test", "np@school.test"):
            with self.subTest(email=email):
                response = self._verify(email)
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
                self.assertEqual(response.data, {"error": "not_school_admin"})

    def test_inactive_admin_with_wrong_password_is_401(self):
        self.assertEqual(self._verify("off@school.test", password="nope").status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_of_other_school_is_wrong_school(self):
        response = self._verify("admin.b@school.test")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data, {"error": "wrong_school"})

    def test_hub_not_registered(self):
        missing = self.client.post(URL, {"email": "admin.a@school.test", "password": PASSWORD}, format="json")
        self.assertEqual(missing.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(missing.data, {"error": "hub_not_registered"})
        self.assertEqual(self._verify("admin.a@school.test", installation="INST-NOPE").data, {"error": "hub_not_registered"})
        LmsServer.objects.filter(pk="INST-A2").update(status=LmsServer.Status.DEACTIVATED)
        self.assertEqual(self._verify("admin.a@school.test", installation="INST-A2").status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self._verify("admin.a@school.test", installation="INST-B1").data, {"error": "hub_not_registered"})

    def test_invalid_body(self):
        for body in ({}, {"email": "", "password": PASSWORD}, {"email": "admin.a@school.test", "password": ""},
                     {"email": "admin.a@school.test", "password": "x" * 257}, {"email": 5, "password": PASSWORD}):
            with self.subTest(body=body):
                response = self.client.post(
                    URL, body, format="json",
                    HTTP_X_SCHOOL_ID="SCH-A", HTTP_X_LICENSE_ID="LIC-A", HTTP_X_INSTALLATION_ID="INST-A1",
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertEqual(response.data, {"error": "invalid_body"})

    def test_throttle_after_10_failures(self):
        for _ in range(10):
            self.assertEqual(self._verify("admin.a@school.test", password="nope").status_code, status.HTTP_401_UNAUTHORIZED)
        blocked = self._verify("admin.a@school.test")
        self.assertEqual(blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(blocked.data["error"], "too_many_attempts")
        self.assertTrue(0 < blocked.data["retry_after"] <= 15 * 60)
        self.assertEqual(self._verify("admin.a@school.test", installation="INST-A2").status_code, status.HTTP_200_OK)

    def test_role_and_school_failures_count(self):
        for _ in range(5):
            self._verify("teach@school.test")
        for _ in range(5):
            self._verify("admin.b@school.test")
        self.assertEqual(self._verify("admin.a@school.test").status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_success_resets_counter(self):
        for _ in range(9):
            self._verify("admin.a@school.test", password="nope")
        self.assertEqual(self._verify("admin.a@school.test").status_code, status.HTTP_200_OK)
        for _ in range(10):
            self.assertEqual(self._verify("admin.a@school.test", password="nope").status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self._verify("admin.a@school.test", password="nope").status_code, status.HTTP_429_TOO_MANY_REQUESTS)
