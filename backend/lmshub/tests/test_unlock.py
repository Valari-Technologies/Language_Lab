from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from lmshub.models import LmsDevice, LmsHubAccess
from school_admin.models import Teacher
from super_admin.models import License, LmsServer, SchoolAdminProfile
from .base import HubTestBase

User = get_user_model()
OVERVIEW = "/api/cms/v1/lms-hub/overview/"
UNLOCK = "/api/cms/v1/lms-hub/unlock/"


class UnlockTests(HubTestBase):
    def setUp(self):
        super().setUp()
        self.api = APIClient()
        self.admin_a = self._admin("admin_a", self.school_a)
        self.admin_a2 = self._admin("admin_a2", self.school_a)
        self.admin_b = self._admin("admin_b", self.school_b)

    def _admin(self, username, school):
        user = User.objects.create_user(username=username, password="x", role=User.Role.SCHOOL_ADMIN)
        SchoolAdminProfile.objects.create(user=user, school=school)
        return user

    def _as(self, user):
        self.api.force_authenticate(user)
        return self.api

    def test_locked_until_key(self):
        response = self._as(self.admin_a).get(OVERVIEW)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["error"], "lms_key_required")
        self.assertNotIn("pairing", response.json())

    def test_wrong_and_empty_key(self):
        api = self._as(self.admin_a)
        self.assertEqual(api.post(UNLOCK, {"key": "KEY-B"}, format="json").json()["error"], "wrong_key")
        self.assertEqual(api.post(UNLOCK, {"key": "  "}, format="json").json()["error"], "key_required")
        for _ in range(10):  # no waiting limit
            self.assertEqual(api.post(UNLOCK, {"key": "nope"}, format="json").status_code, 400)
        self.assertEqual(api.get(OVERVIEW).status_code, 403)

    def test_right_key_unlocks_once_for_the_school(self):
        api = self._as(self.admin_a)
        unlocked = api.post(UNLOCK, {"key": "  key-a "}, format="json")
        self.assertEqual(unlocked.status_code, 200)
        self.assertEqual(api.get(OVERVIEW).json()["school"]["schoolId"], "SCH-A")
        access = LmsHubAccess.objects.get(school=self.school_a)
        self.assertEqual(access.unlocked_by, self.admin_a)
        self.assertNotIn("KEY-A", access.license_key_hash)
        # another admin of the same school: already open; another school: still locked
        self.assertEqual(self._as(self.admin_a2).get(OVERVIEW).status_code, 200)
        self.assertEqual(self._as(self.admin_b).get(OVERVIEW).status_code, 403)

    def test_new_licence_key_locks_again(self):
        self._as(self.admin_a).post(UNLOCK, {"key": "KEY-A"}, format="json")
        License.objects.filter(pk="LIC-A").update(licenseKey="KEY-A-NEW")
        self.assertEqual(self.api.get(OVERVIEW).json()["error"], "lms_key_required")
        self.assertEqual(self.api.post(UNLOCK, {"key": "KEY-A-NEW"}, format="json").status_code, 200)
        self.assertEqual(self.api.get(OVERVIEW).status_code, 200)

    def _server(self, school, key, status=LmsServer.Status.ACTIVE):
        lic = License.objects.get(school=school)
        return LmsServer.objects.create(installationId=f"INST-{key}", serverName="Server", licenseKey=key,
                                        school=school, license=lic, status=status)

    def test_active_lms_server_key_unlocks(self):
        server = self._server(self.school_a, "LMS-KEY-6B4513FFC4EA4E89")
        api = self._as(self.admin_a)
        self.assertEqual(api.post(UNLOCK, {"key": " lms-key-6b4513ffc4ea4e89 "}, format="json").status_code, 200)
        self.assertEqual(api.get(OVERVIEW).status_code, 200)
        # the server is deactivated -> its key no longer opens the page
        LmsServer.objects.filter(pk=server.pk).update(status=LmsServer.Status.DEACTIVATED)
        self.assertEqual(api.get(OVERVIEW).json()["error"], "lms_key_required")
        self.assertEqual(api.post(UNLOCK, {"key": "LMS-KEY-6B4513FFC4EA4E89"}, format="json").json()["error"], "wrong_key")
        self.assertEqual(api.post(UNLOCK, {"key": "KEY-A"}, format="json").status_code, 200)

    def test_other_schools_server_key_refused(self):
        self._server(self.school_b, "LMS-KEY-SCHOOLB")
        self._server(self.school_a, "LMS-KEY-OFF", status=LmsServer.Status.DEACTIVATED)
        api = self._as(self.admin_a)
        self.assertEqual(api.post(UNLOCK, {"key": "LMS-KEY-SCHOOLB"}, format="json").json()["error"], "wrong_key")
        self.assertEqual(api.post(UNLOCK, {"key": "LMS-KEY-OFF"}, format="json").json()["error"], "wrong_key")
        self.assertEqual(api.get(OVERVIEW).status_code, 403)

    def test_remove_computer_needs_unlock(self):
        self.pair()
        device = LmsDevice.objects.get()
        api = self._as(self.admin_a)
        self.assertEqual(api.post(f"/api/cms/v1/lms-hub/devices/{device.id}/remove/").json()["error"], "lms_key_required")
        api.post(UNLOCK, {"key": "KEY-A"}, format="json")
        self.assertEqual(api.post(f"/api/cms/v1/lms-hub/devices/{device.id}/remove/").status_code, 200)

    def test_only_school_admins_unlock(self):
        teacher = User.objects.create_user(username="teach", password="x", role=User.Role.TEACHER)
        Teacher.objects.create(user=teacher, school=self.school_a)
        self.assertEqual(self._as(teacher).post(UNLOCK, {"key": "KEY-A"}, format="json").status_code, 403)
        root = User.objects.create_user(username="root", password="x", role=User.Role.SUPER_ADMIN)
        self.assertEqual(self._as(root).post(UNLOCK, {"key": "KEY-A"}, format="json").status_code, 403)
        self.assertFalse(LmsHubAccess.objects.exists())
