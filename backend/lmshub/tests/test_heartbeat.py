from datetime import timedelta

from django.utils import timezone

from lmshub.models import LmsSession
from .base import HubTestBase


class HeartbeatTests(HubTestBase):
    def test_heartbeat_keeps_session(self):
        token = self.pair()
        session = self.session(token)
        LmsSession.objects.update(last_heartbeat=timezone.now() - timedelta(seconds=100))
        self.assertEqual(self.post("heartbeat", token=token, session=session).json(), {"ok": True})
        self.assertGreater(LmsSession.objects.get().last_heartbeat, timezone.now() - timedelta(seconds=5))

    def test_expiry_after_120_seconds(self):
        token = self.pair()
        session = self.session(token)
        LmsSession.objects.update(last_heartbeat=timezone.now() - timedelta(seconds=121))
        response = self.post("heartbeat", token=token, session=session)
        self.assertEqual((response.status_code, response.json()["error"]), (401, "session_expired"))
        self.assertEqual(LmsSession.objects.get().end_reason, "expired")

    def test_wrong_pc_and_bad_token(self):
        pc1, pc2 = self.pair(), self.pair()
        session = self.session(pc1)
        self.assertEqual(self.post("heartbeat", token=pc2, session=session).json()["error"], "session_wrong_pc")
        self.assertEqual(self.post("heartbeat", token=pc1, session="nope").json()["error"], "session_expired")
        self.assertEqual(self.post("logout", token=pc2, session=session).json()["error"], "session_wrong_pc")

    def test_logout(self):
        token = self.pair()
        session = self.session(token)
        self.assertEqual(self.post("logout", token=token, session=session).json(), {"ok": True})
        self.assertEqual(LmsSession.objects.get().end_reason, "logout")
        self.assertEqual(self.post("heartbeat", token=token, session=session).json()["error"], "session_expired")
        self.assertEqual(self.post("logout", token=token, session=session).json(), {"ok": True})
        self.assertEqual(self.get("status", token=token).json()["seats"]["used"], 0)
