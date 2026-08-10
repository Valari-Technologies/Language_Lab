from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from super_admin.models import School, License, LmsServer

User = get_user_model()


class LicensingSystemTests(APITestCase):

    def setUp(self):
        # Create a super admin user for requests
        self.super_admin = User.objects.create_superuser(
            username="super_admin_test",
            email="super_test@example.com",
            password="testpassword123",
            role=User.Role.SUPER_ADMIN
        )
        self.client.force_authenticate(user=self.super_admin)

    def test_atomic_school_creation(self):
        url = reverse("school-list")
        payload = {
            "name": "Test Academy",
            "address": "123 Main St, City, State - 123456",
            "phone": "9876543210",
            "email": "contact@testacademy.com",
            "admin_name": "Test Admin",
            "admin_username": "test_academy_admin",
            "admin_email": "admin@testacademy.com",
            "admin_password": "securePass123!",
            "maxLmsServers": 3,
            "concurrentUsersPerServer": 50,
            "licenseDuration": "1 Year"
        }

        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify School created
        school = School.objects.get(school_name="Test Academy")
        self.assertIsNotNone(school.schoolId)
        self.assertEqual(school.contactEmail, "contact@testacademy.com")
        self.assertEqual(school.schoolAdminId.username, "test_academy_admin")

        # Verify License created
        license_obj = License.objects.get(school=school)
        self.assertIsNotNone(license_obj.licenseKey)
        self.assertEqual(license_obj.maxLmsServers, 3)
        self.assertEqual(license_obj.concurrentUsersPerServer, 50)
        self.assertEqual(license_obj.status, License.Status.ACTIVE)

    def test_server_activation_flow(self):
        # Setup school and license manually
        school = School.objects.create(
            schoolId="SCH-SETUP",
            school_name="Setup School",
            address="Some Address",
            email="setup@school.com",
            is_active=True
        )
        license_obj = License.objects.create(
            licenseId="LIC-SETUP",
            licenseKey="KEY-SETUP-123",
            school=school,
            maxLmsServers=2,
            concurrentUsersPerServer=30,
            expiryDate=timezone.now().date() + timezone.timedelta(days=100),
            status=License.Status.ACTIVE
        )
        school.licenseId = license_obj
        school.save()

        # 1. Activate server 1 - should succeed
        activation_url = reverse("activate-server")
        payload_1 = {
            "licenseKey": "KEY-SETUP-123",
            "serverName": "Lab 1 Server",
            "installationIdentity": "INSTALL-001"
        }
        res_1 = self.client.post(activation_url, payload_1, format="json")
        self.assertEqual(res_1.status_code, status.HTTP_200_OK)
        self.assertEqual(res_1.data["status"], "success")
        self.assertEqual(res_1.data["installationId"], "INSTALL-001")

        # Verify server created in DB
        server_1 = LmsServer.objects.get(installationId="INSTALL-001")
        self.assertEqual(server_1.serverName, "Lab 1 Server")
        self.assertEqual(server_1.status, LmsServer.Status.ACTIVE)

        # 2. Activate server 2 - should succeed
        payload_2 = {
            "licenseKey": "KEY-SETUP-123",
            "serverName": "Lab 2 Server",
            "installationIdentity": "INSTALL-002"
        }
        res_2 = self.client.post(activation_url, payload_2, format="json")
        self.assertEqual(res_2.status_code, status.HTTP_200_OK)

        # 3. Activate server 3 - should fail (maxLmsServers limit is 2)
        payload_3 = {
            "licenseKey": "KEY-SETUP-123",
            "serverName": "Lab 3 Server",
            "installationIdentity": "INSTALL-003"
        }
        res_3 = self.client.post(activation_url, payload_3, format="json")
        self.assertEqual(res_3.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", res_3.data)
        self.assertIn("Maximum registered LMS servers capacity reached", res_3.data["error"])

        # 4. Deactivate server 1 - should succeed
        deactivate_url = reverse("deactivate-server")
        deact_res = self.client.post(deactivate_url, {"installationId": "INSTALL-001"}, format="json")
        self.assertEqual(deact_res.status_code, status.HTTP_200_OK)

        # Verify deactivated in DB
        server_1.refresh_from_db()
        self.assertEqual(server_1.status, LmsServer.Status.DEACTIVATED)

        # 5. Now server 3 can be activated because server 1 was deactivated
        res_3_retry = self.client.post(activation_url, payload_3, format="json")
        self.assertEqual(res_3_retry.status_code, status.HTTP_200_OK)
