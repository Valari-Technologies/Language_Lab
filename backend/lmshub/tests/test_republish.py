import hashlib

from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from content_studio.models import Activity, Experience, Screen
from .base import HubTestBase, User


class RepublishTests(HubTestBase):
    """A lesson edited, submitted and approved again reaches the LMS with a new file, checksum and version."""

    def setUp(self):
        super().setUp()
        override = override_settings(PACKAGES_ROOT=self.tmp_dir)
        override.enable()
        self.addCleanup(override.disable)
        self.api = APIClient()
        self.creator = User.objects.create_user(username="cc", password="x", role="CONTENT_CREATOR")
        self.root = User.objects.create_user(username="root", password="x", role="SUPER_ADMIN")
        self.exp = Experience.objects.create(
            title="Republish Lesson", description="d", grade=self.grade3, subject="English", language="English",
            difficulty="BEGINNER", estimated_duration=30, status="DRAFT", created_by=self.creator)
        self.activity = Activity.objects.create(
            experience=self.exp, title="Activity One", learning_objective="Learn", estimated_duration=15,
            mastery_threshold=80, display_order=1)
        self._add_screen(1)
        self.token = self.pair()
        self.session_token = self.session(self.token)

    def _add_screen(self, order):
        Screen.objects.create(
            activity=self.activity, title=f"Screen {order}", screen_type="INFORMATION", display_order=order,
            estimated_duration=30,
            content={"elements": [{"id": str(order), "type": "text", "props": {"value": f"Hello {order}"}}]})

    def _submit(self, version):
        self.api.force_authenticate(self.creator)
        response = self.api.post(reverse("publish-experience", kwargs={"experience_id": self.exp.id}),
                                 {"version": version, "release_notes": f"build {version}"}, format="json")
        self.assertEqual(response.status_code, 200, response.content)

    def _approve(self):
        self.api.force_authenticate(self.root)
        response = self.api.post(reverse("super-admin-experiences-approve", args=[self.exp.id]))
        self.assertEqual(response.status_code, 200, response.content)
        return response.data

    def _entry(self, lessons):
        found = [e for e in lessons if e and e["title"] == "Republish Lesson"]
        self.assertEqual(len(found), 1, "the lesson must be in the plan exactly once")
        return found[0]

    def _plan_entry(self):
        plan = self.get("level-plan", token=self.token, session=self.session_token).json()
        return self._entry(plan["lessons"])

    def _offline_entry(self):
        data = self.get("offline-data", token=self.token).json()
        return self._entry(data["plans"][str(self.grade3.id)]["lessons"])

    def _assert_serves(self, version, checksum):
        pkg_id = self._plan_entry()["packageId"]
        for entry in (self._plan_entry(), self._offline_entry()):
            self.assertEqual((entry["version"], entry["checksum"]), (version, checksum))
        for path, session in ((f"packages/{pkg_id}", self.session_token), (f"device-packages/{pkg_id}", None)):
            response, body = self.download(path, self.token, session)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response["X-Package-Version"], version)
            self.assertEqual(response["X-Package-Checksum"], checksum)
            self.assertEqual(hashlib.sha256(body).hexdigest(), checksum)

    def _submit_level(self, exp, version, level):
        self.api.force_authenticate(self.creator)
        return self.api.post(reverse("publish-experience", kwargs={"experience_id": exp.id}),
                             {"version": version, "level": level}, format="json")

    def test_level_places_the_lesson_in_that_lms_slot(self):
        for bad in (0, 31, "abc", -2):
            response = self._submit_level(self.exp, "1.0", bad)
            self.assertEqual(response.status_code, 400, bad)
        self.exp.refresh_from_db()
        self.assertEqual(self.exp.status, "DRAFT")

        self.assertEqual(self._submit_level(self.exp, "1.0", 5).status_code, 200)
        self.exp.refresh_from_db()
        self.assertEqual((self.exp.pending_level, self.exp.level), (5, None))
        self._approve()
        self.exp.refresh_from_db()
        self.assertEqual((self.exp.level, self.exp.pending_level), (5, None))

        plan = self.get("level-plan", token=self.token, session=self.session_token).json()
        self.assertEqual(plan["lessons"][4]["title"], "Republish Lesson")
        self.assertEqual(plan["lessons"][4]["slot"], 5)
        # the two lessons without a level keep the first free slots
        self.assertEqual([e["title"] for e in plan["lessons"][:2]], ["Lesson One", "Lesson Two"])
        self.assertIsNone(plan["lessons"][2])
        offline = self.get("offline-data", token=self.token).json()["plans"][str(self.grade3.id)]
        self.assertEqual(offline["lessons"][4]["title"], "Republish Lesson")

        # re-publishing without a level keeps level 5
        self._add_screen(2)
        self.assertEqual(self._submit_level(self.exp, "1.1", "").status_code, 200)
        self._approve()
        plan = self.get("level-plan", token=self.token, session=self.session_token).json()
        self.assertEqual(plan["lessons"][4]["version"], "1.1")

    def test_level_already_used_is_refused(self):
        self._submit_level(self.exp, "1.0", 5)
        self._approve()
        other = Experience.objects.create(
            title="Other Lesson", description="d", grade=self.grade3, subject="English", language="English",
            difficulty="BEGINNER", estimated_duration=30, status="DRAFT", created_by=self.creator)
        activity = Activity.objects.create(experience=other, title="A", learning_objective="L",
                                           estimated_duration=15, mastery_threshold=80, display_order=1)
        Screen.objects.create(activity=activity, title="S", screen_type="INFORMATION", display_order=1,
                              estimated_duration=30, content={"elements": [{"id": "1", "type": "text", "props": {"value": "x"}}]})
        response = self._submit_level(other, "1.0", 5)
        self.assertEqual(response.status_code, 409)
        self.assertIn("Republish Lesson", response.json()["error"])
        # another free level is fine, and the lesson itself may resubmit its own level 5
        self.assertEqual(self._submit_level(other, "1.0", 6).status_code, 200)
        self.assertEqual(self._submit_level(self.exp, "1.1", 5).status_code, 200)

    def test_edit_submit_approve_updates_every_endpoint(self):
        self._submit("1.0")
        first = self._approve()
        self._assert_serves("1.0", first["checksum"])

        # Saving an edit alone changes nothing for the LMS
        self._add_screen(2)
        self._assert_serves("1.0", first["checksum"])

        # Submitted again: still waiting for approval, the LMS keeps the last approved package
        self._submit("1.1")
        self.exp.refresh_from_db()
        self.assertEqual(self.exp.status, "PENDING_APPROVAL")
        self._assert_serves("1.0", first["checksum"])

        # Approved: new file with the new screen, new checksum, new version everywhere
        second = self._approve()
        self.assertNotEqual(second["checksum"], first["checksum"])
        self.assertEqual(second["version"], "1.1")
        self._assert_serves("1.1", second["checksum"])
