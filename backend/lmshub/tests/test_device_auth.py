from datetime import timedelta

from django.utils import timezone

from lmshub.models import LmsDevice
from .base import BASE, HubTestBase


class DeviceAuthTests(HubTestBase):
    def test_missing_or_unknown_token(self):
        self.assertEqual(self.get("whoami").status_code, 401)
        self.assertEqual(self.get("whoami").json(), {"ok": False, "error": "not_paired"})
        self.assertEqual(self.get("status", token="ab" * 32).json()["error"], "not_paired")
        self.assertEqual(self.get("status", token="garbage").json()["error"], "not_paired")

    def test_revoked(self):
        token = self.pair()
        LmsDevice.objects.update(revoked=True)
        response = self.get("status", token=token)
        self.assertEqual((response.status_code, response.json()["error"]), (401, "revoked"))

    def test_whoami_and_last_seen(self):
        token = self.pair(pc_name="Lab PC 3")
        device = LmsDevice.objects.get()
        LmsDevice.objects.filter(pk=device.pk).update(last_seen=timezone.now() - timedelta(minutes=5), last_ip="10.9.9.9")
        data = self.get("whoami", token=token).json()
        self.assertEqual((data["pcId"], data["pcName"]), (str(device.pc_id), "Lab PC 3"))
        device.refresh_from_db()
        self.assertEqual(device.last_ip, "10.0.0.1")
        self.assertGreater(device.last_seen, timezone.now() - timedelta(seconds=10))

    def test_unknown_route(self):
        token = self.pair()
        self.assertEqual(self.get("nope", token=token).json(), {"ok": False, "error": "not_found"})
        self.assertEqual(self.get("nope").status_code, 401)

    def test_json_and_size_limits(self):
        token = self.pair()
        wrong_type = self.client.post(f"{BASE}/login", data="code=x", content_type="text/plain", HTTP_X_HUB_TOKEN=token)
        self.assertEqual((wrong_type.status_code, wrong_type.json()["error"]), (415, "json_required"))
        too_big = self.client.post(f"{BASE}/login", data='{"code":"' + "x" * (1024 * 1024) + '"}',
                                   content_type="application/json", HTTP_X_HUB_TOKEN=token)
        self.assertEqual((too_big.status_code, too_big.json()["error"]), (413, "body_too_large"))
        bad_json = self.client.post(f"{BASE}/login", data="{oops", content_type="application/json", HTTP_X_HUB_TOKEN=token)
        self.assertEqual((bad_json.status_code, bad_json.json()["error"]), (400, "invalid_json"))
