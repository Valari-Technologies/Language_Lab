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

    def test_delete_school_and_reuse_email(self):
        """Verify that after a school is deleted, its email address can be reused to create a new school."""
        self.client.force_authenticate(user=self.super_admin)
        url = reverse("school-list")
        payload = {
            "school_name": "First School",
            "contactEmail": "reuse@testschool.com",
            "admin_name": "First Admin",
            "admin_email": "reuse@testschool.com",
            "admin_password": "securePass123!",
        }

        res1 = self.client.post(url, payload, format="json")
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        school_id = res1.data["data"]["school_id"]

        # Delete the school
        del_url = reverse("school-detail", args=[school_id])
        del_res = self.client.delete(del_url)
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)

        # Re-create a school with the exact same email
        payload["school_name"] = "Second School"
        payload["admin_username"] = "second_admin"
        res2 = self.client.post(url, payload, format="json")
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res2.data["data"]["school_name"], "Second School")

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
        self.assertEqual(res_1.data["school_id"], "SCH-SETUP")
        self.assertEqual(res_1.data["schoolId"], "SCH-SETUP")
        self.assertEqual(res_1.data["school_name"], "Setup School")
        self.assertEqual(res_1.data["license_id"], "LIC-SETUP")
        self.assertEqual(res_1.data["licenseKey"], "KEY-SETUP-123")
        self.assertEqual(res_1.data["expiryDate"], str(license_obj.expiryDate))

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

    def test_create_lms_server_api_and_activate_with_server_license_key(self):
        school = School.objects.create(
            schoolId="SCH-LMS-TEST",
            school_name="LMS Test School",
            address="Test Addr",
            email="lmstest@school.com",
            is_active=True
        )
        license_obj = License.objects.create(
            licenseId="LIC-LMS-TEST",
            licenseKey="KEY-MASTER-999",
            school=school,
            maxLmsServers=2,
            concurrentUsersPerServer=40,
            expiryDate=timezone.now().date() + timezone.timedelta(days=365),
            status=License.Status.ACTIVE
        )
        school.licenseId = license_obj
        school.save()

        # 1. Create LMS Server via CMS API
        create_url = reverse("school-create-lms-server", kwargs={"school_id": school.school_id})
        res = self.client.post(create_url, {"serverName": "Computer Lab 1", "maxUsers": 40}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("server", res.data)
        server_data = res.data["server"]
        self.assertEqual(server_data["serverName"], "Computer Lab 1")
        self.assertEqual(server_data["maxUsers"], 40)
        self.assertTrue(server_data["licenseKey"].startswith("LMS-KEY-"))
        self.assertTrue(server_data["installationId"].startswith("INST-"))

        # 2. Activate using the newly generated server-specific license key
        activation_url = reverse("activate-server")
        act_res = self.client.post(activation_url, {
            "licenseKey": server_data["licenseKey"],
            "serverName": "Computer Lab 1",
            "installationIdentity": server_data["installationId"]
        }, format="json")
        self.assertEqual(act_res.status_code, status.HTTP_200_OK)
        self.assertEqual(act_res.data["status"], "success")
        self.assertEqual(act_res.data["concurrentUsersPerServer"], 40)
        self.assertEqual(act_res.data["installationId"], server_data["installationId"])

    def test_lms_server_crud_and_disable_enable_toggle(self):
        school = School.objects.create(
            schoolId="SCH-CRUD-TEST",
            school_name="CRUD Test School",
            address="Test Addr",
            email="crudtest@school.com",
            is_active=True
        )
        license_obj = License.objects.create(
            licenseId="LIC-CRUD-TEST",
            licenseKey="KEY-CRUD-999",
            school=school,
            maxLmsServers=3,
            concurrentUsersPerServer=40,
            expiryDate=timezone.now().date() + timezone.timedelta(days=365),
            status=License.Status.ACTIVE
        )
        school.licenseId = license_obj
        school.save()

        # 1. Create server
        create_url = reverse("school-create-lms-server", kwargs={"school_id": school.school_id})
        res = self.client.post(create_url, {"serverName": "Initial Lab", "maxUsers": 40}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        inst_id = res.data["server"]["installationId"]

        # 2. Update / Rename server via PATCH
        update_url = f"/api/cms/v1/lms-servers/{inst_id}/"
        patch_res = self.client.patch(update_url, {"serverName": "Renamed Lab A"}, format="json")
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data["server"]["serverName"], "Renamed Lab A")

        # 3. Disable server via toggle-status
        toggle_url = f"/api/cms/v1/lms-servers/{inst_id}/toggle-status/"
        toggle_res = self.client.post(toggle_url, format="json")
        self.assertEqual(toggle_res.status_code, status.HTTP_200_OK)
        self.assertEqual(toggle_res.data["server"]["status"], "DEACTIVATED")

        # 4. Re-enable server via toggle-status
        toggle_res2 = self.client.post(toggle_url, format="json")
        self.assertEqual(toggle_res2.status_code, status.HTTP_200_OK)
        self.assertEqual(toggle_res2.data["server"]["status"], "ACTIVE")

        # 5. Delete server
        delete_res = self.client.delete(update_url, format="json")
        self.assertEqual(delete_res.status_code, status.HTTP_200_OK)
        self.assertFalse(LmsServer.objects.filter(installationId=inst_id).exists())
