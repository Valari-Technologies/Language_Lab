import re
import uuid
from datetime import timedelta

from django.utils import timezone

from lmshub.core import current_pairing_code, sha256_hex
from lmshub.models import LmsDevice, LmsPairingCode
from .base import HubTestBase


class PairingTests(HubTestBase):
    def _pair_body(self, code=None, school_code="SCH-A", pc_id=None):
        return {
            "schoolCode": school_code,
            "pairingCode": code if code is not None else current_pairing_code(self.school_a).code,
            "pcId": pc_id or str(uuid.uuid4()),
            "pcName": "Lab PC 7",
        }

    def test_pair_ok_stores_only_token_hash(self):
        pc_id = str(uuid.uuid4())
        response = self.post("pair", self._pair_body(pc_id=pc_id))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["ok"])
        self.assertTrue(re.fullmatch(r"[0-9a-f]{64}", data["hubToken"]))
        self.assertEqual(data["hubName"], "Time (CMS)")
        device = LmsDevice.objects.get(pc_id=pc_id)
        self.assertEqual((device.school, device.pc_name, device.last_ip), (self.school_a, "Lab PC 7", "10.0.0.1"))
        self.assertEqual(device.token_hash, sha256_hex(data["hubToken"]))
        self.assertNotEqual(device.token_hash, data["hubToken"])

    def test_pair_with_school_code(self):
        self.assertEqual(self.post("pair", self._pair_body(school_code="tim_004")).status_code, 200)

    def test_wrong_code_and_unknown_school(self):
        wrong = self.post("pair", self._pair_body(code="000000" if current_pairing_code(self.school_a).code != "000000" else "111111"))
        self.assertEqual((wrong.status_code, wrong.json()["error"]), (403, "wrong_code"))
        unknown = self.post("pair", self._pair_body(school_code="SCH-NOPE"))
        self.assertEqual((unknown.status_code, unknown.json()["error"]), (403, "wrong_code"))

    def test_invalid_pc_id(self):
        response = self.post("pair", self._pair_body(pc_id="not-a-uuid"))
        self.assertEqual((response.status_code, response.json()["error"]), (400, "invalid_pc_id"))

    def test_lockout_after_five_wrong_codes_per_ip(self):
        bad = "000000" if current_pairing_code(self.school_a).code != "000000" else "111111"
        for _ in range(5):
            self.assertEqual(self.post("pair", self._pair_body(code=bad), ip="10.0.0.9").status_code, 403)
        locked = self.post("pair", self._pair_body(), ip="10.0.0.9")
        self.assertEqual(locked.status_code, 429)
        self.assertEqual(locked.json()["error"], "too_many_attempts")
        self.assertTrue(290 <= locked.json()["retryAfterSec"] <= 300)
        self.assertEqual(self.post("pair", self._pair_body(), ip="10.0.0.10").status_code, 200)

    def test_expired_code_is_replaced(self):
        old = current_pairing_code(self.school_a).code
        LmsPairingCode.objects.filter(school=self.school_a).update(expires_at=timezone.now() - timedelta(seconds=1))
        new = current_pairing_code(self.school_a)
        self.assertGreater(new.expires_at, timezone.now() + timedelta(minutes=9))
        if new.code != old:
            self.assertEqual(self.post("pair", self._pair_body(code=old)).json()["error"], "wrong_code")
        self.assertEqual(self.post("pair", self._pair_body(code=new.code)).status_code, 200)

    def test_one_code_per_school(self):
        code = current_pairing_code(self.school_a)
        self.assertEqual(current_pairing_code(self.school_a).pk, code.pk)
        self.assertEqual(LmsPairingCode.objects.filter(school=self.school_a).count(), 1)

    def test_repair_after_remove_gives_new_token(self):
        pc_id = str(uuid.uuid4())
        old = self.pair(pc_id=pc_id)
        LmsDevice.objects.filter(pc_id=pc_id).update(revoked=True)
        self.assertEqual(self.get("whoami", token=old).json()["error"], "revoked")
        new = self.pair(pc_id=pc_id)
        self.assertNotEqual(old, new)
        self.assertEqual(self.get("whoami", token=new).status_code, 200)
        self.assertEqual(self.get("whoami", token=old).json()["error"], "not_paired")
        self.assertEqual(LmsDevice.objects.filter(pc_id=pc_id).count(), 1)

    def test_health(self):
        anonymous = self.get("health").json()
        self.assertEqual((anonymous["ok"], anonymous["mode"], anonymous["appVersion"]), (True, "hub", "cms"))
        token = self.pair()
        with_token = self.get("health", token=token).json()
        self.assertEqual((with_token["hubName"], with_token["schoolId"]), ("Time (CMS)", "SCH-A"))
        self.assertEqual(self.get("health/").status_code, 200)
