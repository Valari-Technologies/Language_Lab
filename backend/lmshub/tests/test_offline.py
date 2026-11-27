import hashlib
import hmac
import uuid
from unittest import mock

from django.utils import timezone

from assessments.models import StudentAttempt
from lmshub.models import LmsProgressEvent
from super_admin.models import License
from .base import HubTestBase


def key_for(token, code):
    return hmac.new(token.encode(), code.upper().encode(), hashlib.sha256).hexdigest()


class OfflineTests(HubTestBase):
    def test_offline_data_has_no_plain_codes(self):
        token = self.pair()
        response = self.get("offline-data", token=token)
        self.assertEqual(response.status_code, 200)
        text = response.content.decode()
        for code in ("AAR_1001", "aar_1001", "DIY_1002", "KAB_8001", "ANA_9001"):
            self.assertNotIn(code, text)
        data = response.json()
        self.assertEqual(data["schoolName"], "Time")
        by_id = {s["id"]: s for s in data["students"]}
        self.assertNotIn(self.sb.student_id, by_id)
        s1 = by_id[self.s1.student_id]
        self.assertEqual(s1["codeKeys"], [key_for(token, "AAR_1001")])
        self.assertEqual((s1["gradeId"], s1["grade_number"], s1["planError"]), (str(self.grade3.id), 3, None))
        self.assertEqual(set(data["plans"]), {str(self.grade3.id), str(self.grade4.id)})
        self.assertNotIn("student", data["plans"][str(self.grade3.id)])

    def test_keys_differ_per_device(self):
        a, b = self.pair(), self.pair()
        key_a = [s for s in self.get("offline-data", token=a).json()["students"] if s["id"] == self.s1.student_id][0]
        key_b = [s for s in self.get("offline-data", token=b).json()["students"] if s["id"] == self.s1.student_id][0]
        self.assertNotEqual(key_a["codeKeys"], key_b["codeKeys"])

    def test_offline_data_needs_active_licence(self):
        token = self.pair()
        License.objects.filter(pk="LIC-A").update(status=License.Status.SUSPENDED)
        response = self.get("offline-data", token=token)
        self.assertEqual((response.status_code, response.json()["error"]), (403, "not_activated"))

    def test_offline_data_rate_limit(self):
        token = self.pair()
        with mock.patch("lmshub.views.OFFLINE_DATA_PER_HOUR", 2):
            self.assertEqual(self.get("offline-data", token=token).status_code, 200)
            self.assertEqual(self.get("offline-data", token=token).status_code, 200)
            limited = self.get("offline-data", token=token)
        self.assertEqual((limited.status_code, limited.json()["error"]), (429, "too_many_requests"))

    def _offline_event(self):
        return {"event_id": str(uuid.uuid4()), "level_key": "L1", "package_id": str(self.lesson1.id), "stars": 3,
                "score": 80, "max_score": 100, "completed": True, "completed_at": timezone.now().isoformat(),
                "pc_sent_at": timezone.now().isoformat()}

    def test_offline_progress(self):
        token = self.pair()
        event = self._offline_event()
        response = self.post("offline-progress", {"student_id": self.s1.student_id,
                                                  "code_key": key_for(token, "AAR_1001"), "event": event}, token=token)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["levels"][0]["best_stars"], 3)
        self.assertEqual(LmsProgressEvent.objects.get(event_id=event["event_id"]).type, "offline")
        self.assertTrue(StudentAttempt.objects.filter(lms_attempt_id=event["event_id"]).exists())

    def test_offline_progress_wrong_key(self):
        token, other = self.pair(), self.pair()
        for body in (
            {"student_id": self.s1.student_id, "code_key": "0" * 64, "event": self._offline_event()},
            {"student_id": self.s1.student_id, "code_key": key_for(other, "AAR_1001"), "event": self._offline_event()},
            {"student_id": self.sb.student_id, "code_key": key_for(token, "OTH_0001"), "event": self._offline_event()},
        ):
            response = self.post("offline-progress", body, token=token)
            self.assertEqual((response.status_code, response.json()["error"]), (404, "student_not_found"))
        self.assertEqual(self.post("offline-progress", {"student_id": 1}, token=token).json()["error"], "invalid_body")
