from .base import HubTestBase


class ResumeTests(HubTestBase):
    def _position(self, **overrides):
        body = {"package_id": "42", "level_key": "L2", "package_version": "1.0", "signature": "sig",
                "activityIndex": 1, "screenIndex": 3, "answeredBlockIds": ["b1", "b2"]}
        body.update(overrides)
        return body

    def test_save_and_list(self):
        token = self.pair()
        session = self.session(token)
        saved = self.put("resume", self._position(), token=token, session=session)
        self.assertEqual(saved.status_code, 200)
        positions = self.get("resume", token=token, session=session).json()["positions"]
        self.assertEqual(len(positions), 1)
        self.assertEqual((positions[0]["activityIndex"], positions[0]["screenIndex"], positions[0]["answeredBlockIds"]),
                         (1, 3, ["b1", "b2"]))
        self.assertEqual(positions[0]["updated_at"], saved.json()["updated_at"])

    def test_invalid_resume(self):
        token = self.pair()
        session = self.session(token)
        for bad in (self._position(level_key="X1"), self._position(activityIndex=-1), self._position(answeredBlockIds="x")):
            self.assertEqual(self.put("resume", bad, token=token, session=session).json()["error"], "invalid_resume")

    def test_stale_session(self):
        pc1, pc2 = self.pair(), self.pair()
        old = self.session(pc1)
        self.session(pc2)  # replaces the first session
        response = self.put("resume", self._position(), token=pc1, session=old)
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json(), {"ok": False, "error": "stale_session", "reason": "session_replaced"})
        self.assertEqual(self.get("resume", token=pc1, session=old).status_code, 401)
        self.assertEqual(self.delete("resume/42", token=pc1, session=old).json()["error"], "stale_session")

    def test_stale_position(self):
        pc1, pc2 = self.pair(), self.pair()
        first = self.session(pc1)
        written = self.put("resume", self._position(), token=pc1, session=first).json()["updated_at"]
        second = self.session(pc2)
        stale = self.put("resume", self._position(screenIndex=0), token=pc2, session=second)
        self.assertEqual(stale.status_code, 409)
        self.assertEqual(stale.json(), {"ok": False, "error": "stale_position", "updated_at": written})
        fresh = self.put("resume", self._position(screenIndex=5, base_updated_at=written), token=pc2, session=second)
        self.assertEqual(fresh.status_code, 200)
        self.assertEqual(self.put("resume", self._position(screenIndex=6), token=pc2, session=second).status_code, 200)

    def test_delete_with_base(self):
        pc1, pc2 = self.pair(), self.pair()
        first = self.session(pc1)
        written = self.put("resume", self._position(), token=pc1, session=first).json()["updated_at"]
        second = self.session(pc2)
        self.assertEqual(self.delete("resume/42", token=pc2, session=second).json()["error"], "stale_position")
        response = self.client.delete(f"/api/lms-hub/resume/42?base={written}".replace("+", "%2B"),
                                      HTTP_X_HUB_TOKEN=pc2, HTTP_X_SESSION_TOKEN=second)
        self.assertEqual(response.json(), {"ok": True, "deleted": True})
        self.assertEqual(self.delete("resume/42", token=pc2, session=second).json(), {"ok": True, "deleted": False})
