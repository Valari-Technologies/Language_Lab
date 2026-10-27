import uuid

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from lmshub.models import LmsDevice, LmsProgressEvent, LmsSession
from school_admin.models import Teacher
from super_admin.models import License, LmsServer, SchoolAdminProfile
from .base import HubTestBase

User = get_user_model()
OVERVIEW = "/api/cms/v1/lms-hub/overview/"


class AdminPageTests(HubTestBase):
    def setUp(self):
        super().setUp()
        self.api = APIClient()
        self.admin_a = User.objects.create_user(username="admin_a", password="x", role=User.Role.SCHOOL_ADMIN)
        SchoolAdminProfile.objects.create(user=self.admin_a, school=self.school_a)
        self.admin_b = User.objects.create_user(username="admin_b", password="x", role=User.Role.SCHOOL_ADMIN)
        SchoolAdminProfile.objects.create(user=self.admin_b, school=self.school_b)
        self.super_admin = User.objects.create_user(username="root", password="x", role=User.Role.SUPER_ADMIN)
        self.teacher = User.objects.create_user(username="teach", password="x", role=User.Role.TEACHER)
        Teacher.objects.create(user=self.teacher, school=self.school_a)
        # Both schools have opened the LMS Hub with their licence key (see test_unlock.py)
        for admin, key in ((self.admin_a, "KEY-A"), (self.admin_b, "KEY-B")):
            self.api.force_authenticate(admin)
            self.assertEqual(self.api.post("/api/cms/v1/lms-hub/unlock/", {"key": key}, format="json").status_code, 200)
        self.api.force_authenticate(None)

    def test_overview_for_school_admin(self):
        token = self.pair(pc_name="Lab PC 1")
        session = self.session(token, "DIY_1002")
        self.post("progress", {"event_id": str(uuid.uuid4()), "level_key": "L1", "package_id": str(self.lesson1.id),
                               "stars": 1, "score": 50, "max_score": 100, "completed": True}, token=token, session=session)
        self.api.force_authenticate(self.admin_a)
        data = self.api.get(OVERVIEW).json()
        self.assertEqual(data["school"]["schoolId"], "SCH-A")
        self.assertRegex(data["pairing"]["code"], r"^\d{6}$")
        self.assertTrue(0 < data["pairing"]["secondsLeft"] <= 600)
        self.assertEqual(data["seats"], {"used": 1, "total": 2})
        self.assertEqual(data["devices"][0]["pcName"], "Lab PC 1")
        self.assertTrue(data["devices"][0]["inUse"])
        self.assertEqual(data["sessions"][0]["loginCode"], "DIY_1002")
        self.assertEqual(data["sessions"][0]["deviceId"], LmsDevice.objects.get().id)
        self.assertEqual([p["grade"]["id"] for p in data["plans"]], [self.grade3.id, self.grade4.id])
        self.assertEqual(data["progress"]["attemptsToday"], 1)
        self.assertEqual(data["progress"]["noClass"][0]["loginCode"], "DIY_1002")

    def test_lms_servers_card_and_seats_from_server_capacity(self):
        lic = License.objects.get(school=self.school_a)
        LmsServer.objects.create(installationId="INST-1", serverName="Lab server", licenseKey="LMS-KEY-1111222233334444",
                                 school=self.school_a, license=lic, maxUsers=30, lastSyncTime=timezone.now(),
                                 deviceName="LAB-PC")
        LmsServer.objects.create(installationId="INST-2", serverName="Spare", licenseKey="LMS-KEY-5555666677778888",
                                 school=self.school_a, license=lic, maxUsers=25)
        LmsServer.objects.create(installationId="INST-3", serverName="Old", licenseKey="LMS-KEY-9999000011112222",
                                 school=self.school_a, license=lic, maxUsers=50, status=LmsServer.Status.DEACTIVATED)
        LmsServer.objects.create(installationId="INST-B", serverName="Other", licenseKey="LMS-KEY-BBBB",
                                 school=self.school_b, license=License.objects.get(school=self.school_b), maxUsers=99)
        self.api.force_authenticate(self.admin_a)
        data = self.api.get(OVERVIEW).json()
        # seats = capacity of the ACTIVE servers (30 + 25), not the deactivated one or another school's
        self.assertEqual(data["seats"]["total"], 55)
        servers = data["lmsServers"]
        self.assertEqual(len(servers), 3)
        first = servers[0]
        self.assertEqual(first["name"], "LAB-PC")
        self.assertEqual(first["licenseKey"], "LMS-KEY-…4444")
        self.assertTrue(first["activated"])
        self.assertIsNotNone(first["activatedAt"])
        self.assertEqual(first["expiryDate"], lic.expiryDate.isoformat())
        self.assertEqual(first["userCapacity"], 30)
        self.assertFalse(servers[1]["activated"])
        self.assertIsNone(servers[1]["activatedAt"])
        self.assertEqual(servers[2]["status"], "DEACTIVATED")

    def test_super_admin_needs_school_and_teacher_is_refused(self):
        self.api.force_authenticate(self.super_admin)
        self.assertEqual(self.api.get(OVERVIEW).status_code, 400)
        self.assertEqual(self.api.get(OVERVIEW, {"school_id": self.school_b.school_id}).json()["school"]["schoolId"], "SCH-B")
        self.api.force_authenticate(self.teacher)
        self.assertEqual(self.api.get(OVERVIEW).status_code, 403)

    def test_remove_device_ends_sessions(self):
        token = self.pair()
        self.session(token)
        device = LmsDevice.objects.get()
        self.api.force_authenticate(self.admin_b)
        self.assertEqual(self.api.post(f"/api/cms/v1/lms-hub/devices/{device.id}/remove/").status_code, 404)
        self.api.force_authenticate(self.admin_a)
        self.assertEqual(self.api.post(f"/api/cms/v1/lms-hub/devices/{device.id}/remove/").status_code, 200)
        device.refresh_from_db()
        self.assertTrue(device.revoked)
        self.assertEqual(LmsSession.objects.get().end_reason, "pc_removed")
        self.assertEqual(self.get("status", token=token).json()["error"], "revoked")
        self.assertFalse(LmsProgressEvent.objects.exists())
