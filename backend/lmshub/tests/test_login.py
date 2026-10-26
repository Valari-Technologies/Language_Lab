from datetime import timedelta

from django.utils import timezone

from lmshub.models import LmsSession, LmsThrottle
from super_admin.models import License
from .base import HubTestBase


class LoginTests(HubTestBase):
    def test_login_ok(self):
        token = self.pair()
        response = self.login(token, "aar_1001")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertRegex(data["sessionToken"], r"^[0-9a-f]{64}$")
        self.assertEqual(data["student"], {"id": self.s1.student_id, "name": "Student 1001", "login_code": "AAR_1001",
                                           "grade": "Class 3", "grade_number": 3})
        session = LmsSession.objects.get()
        self.assertNotEqual(session.token_hash, data["sessionToken"])

    def test_code_required(self):
        token = self.pair()
        self.assertEqual(self.login(token, "").json()["error"], "code_required")
        self.assertEqual(self.login(token, "x" * 65).json()["error"], "code_required")

    def test_invalid_code_and_lock(self):
        token = self.pair()
        for remaining in (4, 3, 2, 1):
            response = self.login(token, "NOBODY")
            self.assertEqual((response.status_code, response.json()["attemptsRemaining"]), (404, remaining))
        locked = self.login(token, "NOBODY")
        self.assertEqual((locked.status_code, locked.json()["error"]), (429, "locked"))
        self.assertEqual(locked.json()["retryAfterSec"], 10)
        still_locked = self.login(token, "AAR_1001").json()
        self.assertEqual(still_locked["error"], "locked")
        self.assertTrue(1 <= still_locked["retryAfterSec"] <= 10)
        other_pc = self.pair()
        self.assertEqual(self.login(other_pc, "AAR_1001").status_code, 200)
        # after the 10 s lock the same PC can log in again
        LmsThrottle.objects.filter(key__startswith="login:").update(locked_until=timezone.now() - timedelta(seconds=1))
        self.assertEqual(self.login(token, "AAR_1001").status_code, 200)

    def test_only_this_school_and_active_students(self):
        token = self.pair()
        self.assertEqual(self.login(token, "OTH_0001").json()["error"], "invalid_code")
        self.s3.user.is_active = False
        self.s3.user.save()
        self.assertEqual(self.login(token, "KAB_8001").json()["error"], "invalid_code")

    def test_licence_states(self):
        token = self.pair()
        License.objects.filter(pk="LIC-A").update(status=License.Status.SUSPENDED)
        self.assertEqual(self.login(token).json()["error"], "not_activated")
        License.objects.filter(pk="LIC-A").update(status=License.Status.ACTIVE,
                                                  expiryDate=timezone.now().date() - timedelta(days=1))
        response = self.login(token)
        self.assertEqual((response.status_code, response.json()["error"]), (403, "license_expired"))

    def test_seats_unknown(self):
        token = self.pair()
        License.objects.filter(pk="LIC-A").update(concurrentUsersPerServer=0)
        self.assertEqual(self.login(token).status_code, 503)

    def test_seats_full(self):
        pcs = [self.pair() for _ in range(3)]
        self.session(pcs[0], "AAR_1001")
        self.session(pcs[1], "KAB_8001")
        full = self.login(pcs[2], "DIY_1002")
        self.assertEqual(full.status_code, 409)
        self.assertEqual(full.json(), {"ok": False, "error": "seats_full", "used": 2, "total": 2})
        status = self.get("status", token=pcs[0]).json()
        self.assertEqual(status["seats"], {"used": 2, "total": 2})
        self.assertTrue(status["licenseActive"])

    def test_replaced_and_pc_new_login(self):
        pc1, pc2 = self.pair(), self.pair()
        first = self.session(pc1, "AAR_1001")
        self.session(pc2, "AAR_1001")          # same student elsewhere -> replaced
        self.assertEqual(self.post("heartbeat", token=pc1, session=first).json()["error"], "session_replaced")

        on_pc1 = self.session(pc1, "KAB_8001")
        self.session(pc1, "DIY_1002")          # same PC, new student -> pc_new_login
        self.assertEqual(LmsSession.objects.get(student=self.s3).end_reason, "pc_new_login")
        self.assertEqual(self.post("heartbeat", token=pc1, session=on_pc1).json()["error"], "session_expired")

    def test_rejoin_session_elsewhere(self):
        pc1, pc2 = self.pair(), self.pair()
        self.session(pc1, "AAR_1001")
        response = self.login(pc2, "AAR_1001", rejoin=True)
        self.assertEqual((response.status_code, response.json()["error"]), (409, "session_elsewhere"))
        self.assertEqual(self.login(pc1, "AAR_1001", rejoin=True).status_code, 200)

    def test_expired_sessions_free_seats(self):
        pcs = [self.pair() for _ in range(3)]
        self.session(pcs[0], "AAR_1001")
        self.session(pcs[1], "KAB_8001")
        LmsSession.objects.update(last_heartbeat=timezone.now() - timedelta(seconds=121))
        self.assertEqual(self.login(pcs[2], "DIY_1002").status_code, 200)
        self.assertEqual(LmsSession.objects.filter(end_reason="expired").count(), 2)
