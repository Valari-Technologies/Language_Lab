from lmshub.core import current_pairing_code
from .base import HubTestBase


class SchoolIsolationTests(HubTestBase):
    def test_device_of_school_a_never_sees_school_b(self):
        token_a = self.pair(self.school_a)
        token_b = self.pair(self.school_b)

        self.assertEqual(self.login(token_a, "OTH_0001").json()["error"], "invalid_code")
        session_b = self.session(token_b, "OTH_0001")
        self.assertEqual(self.post("heartbeat", token=token_a, session=session_b).json()["error"], "session_wrong_pc")
        self.assertEqual(self.get("level-plan", token=token_a, session=session_b).json()["error"], "session_wrong_pc")

        ids_a = {s["id"] for s in self.get("offline-data", token=token_a).json()["students"]}
        self.assertNotIn(self.sb.student_id, ids_a)
        self.assertEqual(self.download(f"device-packages/{self.lesson_g4.id}", token_b)[0].status_code, 200)
        self.assertEqual(self.download(f"device-packages/{self.lesson1.id}", token_b)[0].status_code, 404)

        status_b = self.get("status", token=token_b).json()
        self.assertEqual((status_b["schoolName"], status_b["seats"]["total"]), ("Other", 40))

    def test_pairing_code_belongs_to_its_school(self):
        code_a = current_pairing_code(self.school_a).code
        code_b = current_pairing_code(self.school_b).code
        if code_a != code_b:
            response = self.post("pair", {"schoolCode": "SCH-B", "pairingCode": code_a,
                                          "pcId": "11111111-2222-3333-4444-555555555555", "pcName": "x"})
            self.assertEqual(response.json()["error"], "wrong_code")
