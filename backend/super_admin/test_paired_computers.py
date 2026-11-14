from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from super_admin.models import License, LmsServer, RemovedInstallation, School, SchoolAdminProfile

User = get_user_model()
ACTIVATE = "/api/v1/licensing/activate-server"
STATUS = "/api/v1/licensing/status"


class PairedComputersTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(
            schoolId="SCH-T", school_name="Time", address="1 Main St", phone="100", email="t@school.test"
        )
        self.license = License.objects.create(
            licenseId="LIC-T", licenseKey="KEY-T", school=self.school, maxLmsServers=2,
            expiryDate=timezone.now().date() + timedelta(days=365),
        )
        self.super_admin = User.objects.create_user(username="root", password="x", role=User.Role.SUPER_ADMIN)
        self.school_admin = User.objects.create_user(username="mani", password="x", role=User.Role.SCHOOL_ADMIN)
        SchoolAdminProfile.objects.create(user=self.school_admin, school=self.school)

    def _activate(self, inst, key="KEY-T", **extra):
        body = {"licenseKey": key, "serverName": f"Hub {inst}", "installationIdentity": inst,
                "deviceName": f"PC-{inst}", "localIp": "192.168.1.20"}
        body.update(extra)
        return self.client.post(ACTIVATE, body, format="json", HTTP_X_REAL_IP="203.0.113.7")

    def _status(self, inst, license_id="LIC-T"):
        return self.client.post(STATUS, {"installationId": inst, "licenseId": license_id}, format="json")

    def _remove(self, inst, user=None):
        self.client.force_authenticate(user or self.super_admin)
        response = self.client.post(f"/api/cms/v1/lms-servers/{inst}/remove/")
        self.client.force_authenticate(None)
        return response

    def test_activation_records_device_details(self):
        self.assertEqual(self._activate("INST-1").status_code, status.HTTP_200_OK)
        server = LmsServer.objects.get(pk="INST-1")
        self.assertEqual((server.deviceName, server.publicIp, server.localIp), ("PC-INST-1", "203.0.113.7", "192.168.1.20"))
        self.assertIsNotNone(server.lastSeenAt)

    def test_invalid_local_ip_is_ignored(self):
        self._activate("INST-1", localIp="not-an-ip")
        self.assertIsNone(LmsServer.objects.get(pk="INST-1").localIp)

    def test_remove_blocks_pc_and_frees_slot(self):
        self._activate("INST-1")
        self._activate("INST-2")
        self.assertEqual(self._activate("INST-3").status_code, status.HTTP_400_BAD_REQUEST)

        response = self._remove("INST-1")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        server = LmsServer.objects.get(pk="INST-1")
        self.assertEqual(server.status, LmsServer.Status.DEACTIVATED)
        self.assertIsNotNone(server.removedAt)
        self.assertTrue(RemovedInstallation.objects.filter(installationId="INST-1", license=self.license).exists())

        blocked = self._activate("INST-1")
        self.assertEqual(blocked.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(blocked.data["error"], "device_removed")
        self.assertEqual(self._activate("INST-3").status_code, status.HTTP_200_OK)

    def test_removed_pc_blocked_with_its_server_key(self):
        server_key = LmsServer.objects.create(
            installationId="INST-K", serverName="Keyed", licenseKey="LMS-KEY-K", school=self.school, license=self.license
        ).licenseKey
        self.assertEqual(self._activate("INST-K", key=server_key).status_code, status.HTTP_200_OK)
        self._remove("INST-K")
        self.assertEqual(self._activate("INST-K", key=server_key).data["error"], "device_removed")

    def test_status_endpoint(self):
        self._activate("INST-1")
        self.assertEqual(self._status("INST-1").data["status"], "ACTIVE")
        self.assertEqual(self._status("INST-NOPE").data["status"], "UNKNOWN")
        self.assertEqual(self._status("INST-1", license_id="LIC-NOPE").data["status"], "UNKNOWN")
        LmsServer.objects.filter(pk="INST-1").update(status=LmsServer.Status.DEACTIVATED)
        self.assertEqual(self._status("INST-1").data["status"], "SUSPENDED")
        self._remove("INST-1")
        self.assertEqual(self._status("INST-1").data["status"], "REMOVED")
        self.assertEqual(self.client.post(STATUS, {}, format="json").status_code, status.HTTP_400_BAD_REQUEST)

    def test_status_expired_licence(self):
        self._activate("INST-1")
        License.objects.filter(pk="LIC-T").update(expiryDate=timezone.now().date() - timedelta(days=1))
        self.assertEqual(self._status("INST-1").data["status"], "EXPIRED")

    def test_status_updates_last_seen(self):
        self._activate("INST-1")
        old = timezone.now() - timedelta(days=2)
        LmsServer.objects.filter(pk="INST-1").update(lastSeenAt=old)
        self._status("INST-1")
        self.assertGreater(LmsServer.objects.get(pk="INST-1").lastSeenAt, old)

    def test_allow_again_needs_free_slot(self):
        self._activate("INST-1")
        self._activate("INST-2")
        self._remove("INST-1")
        self._activate("INST-3")

        self.client.force_authenticate(self.super_admin)
        self.assertEqual(self.client.post("/api/cms/v1/lms-servers/INST-1/allow/").status_code, status.HTTP_200_OK)
        self.client.force_authenticate(None)
        self.assertFalse(RemovedInstallation.objects.exists())
        self.assertEqual(self._activate("INST-1").status_code, status.HTTP_400_BAD_REQUEST)

        self._remove("INST-3")
        self.assertEqual(self._activate("INST-1").status_code, status.HTTP_200_OK)
        self.assertEqual(LmsServer.objects.get(pk="INST-1").status, LmsServer.Status.ACTIVE)

    def test_school_admin_cannot_remove(self):
        self._activate("INST-1")
        self.assertEqual(self._remove("INST-1", user=self.school_admin).status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(RemovedInstallation.objects.exists())

    def test_removed_hub_loses_hub_access(self):
        self._activate("INST-1")
        headers = {"HTTP_X_SCHOOL_ID": "SCH-T", "HTTP_X_LICENSE_ID": "LIC-T", "HTTP_X_INSTALLATION_ID": "INST-1"}
        self.assertEqual(self.client.get("/api/packages/level-map/school/", **headers).status_code, status.HTTP_200_OK)
        self._remove("INST-1")
        self.assertEqual(self.client.get("/api/packages/level-map/school/", **headers).status_code, status.HTTP_403_FORBIDDEN)
