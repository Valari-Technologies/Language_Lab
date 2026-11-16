from datetime import datetime, timedelta, timezone as dt_timezone
from unittest import mock

from django.test import Client
from django.utils import timezone

from lmshub.core import license_state
from super_admin.licensing import is_past, license_today
from super_admin.models import License, LmsServer
from .base import HubTestBase


class KeyExpiryTests(HubTestBase):
    """/api/lms-hub/status and the licence status answer follow each LMS key's own expiry date."""

    def _key(self, name, expiry, status=LmsServer.Status.ACTIVE, users=40):
        return LmsServer.objects.create(
            installationId=f"INST-{name}", serverName=name, licenseKey=f"LMS-KEY-0000000000{name}", school=self.school_a,
            license=self.license_a, status=status, maxUsers=users, expiryDate=expiry, lastSyncTime=timezone.now())

    def _status(self, token):
        response = self.get("status", token)
        self.assertEqual(response.status_code, 200, response.content)
        return response.json()

    def test_a_valid_key_keeps_the_school_licensed_when_another_key_expired(self):
        today = license_today()
        self._key("OLD1", today - timedelta(days=5))   # activated earlier, now past its own date
        self._key("NEW2", today + timedelta(days=1))   # the key in use
        token = self.pair()
        body = self._status(token)
        self.assertEqual((body["licenseActive"], body["expired"]), (True, False))
        self.assertEqual(license_state(self.school_a)["key"].installationId, "INST-NEW2")

    def test_deactivated_keys_are_ignored_and_expired_keys_make_it_expired(self):
        today = license_today()
        self._key("OFF1", today + timedelta(days=300), status=LmsServer.Status.DEACTIVATED)
        self._key("OLD2", today - timedelta(days=1))
        body = self._status(self.pair())
        self.assertEqual((body["licenseActive"], body["expired"]), (False, True))  # the only switched-on key is past its date

    def test_only_deactivated_keys_is_not_expired_but_not_active(self):
        self._key("OFF2", license_today() + timedelta(days=300), status=LmsServer.Status.DEACTIVATED)
        body = self._status(self.pair())
        self.assertEqual((body["licenseActive"], body["expired"]), (False, False))

    def test_a_key_without_its_own_date_uses_the_licence_date(self):
        self._key("LIC3", None)
        self.assertEqual(self._status(self.pair())["licenseActive"], True)
        License.objects.filter(pk="LIC-A").update(expiryDate=license_today() - timedelta(days=1))
        body = self._status(self.pair())
        self.assertEqual((body["licenseActive"], body["expired"]), (False, True))

    def test_the_cutoff_is_the_end_of_the_expiry_day_in_the_schools_time_zone(self):
        # 2026-11-16 18:00 UTC is 23:30 on 11/16 in India; 20:00 UTC is 01:30 on 11/17
        self._key("DAY4", datetime(2026, 11, 16).date())
        with mock.patch("super_admin.licensing.timezone.now", return_value=datetime(2026, 11, 16, 18, 0, tzinfo=dt_timezone.utc)):
            self.assertTrue(license_state(self.school_a)["active"])
            self.assertFalse(is_past(datetime(2026, 11, 16).date()))
        with mock.patch("super_admin.licensing.timezone.now", return_value=datetime(2026, 11, 16, 20, 0, tzinfo=dt_timezone.utc)):
            state = license_state(self.school_a)
            self.assertEqual((state["active"], state["expired"]), (False, True))

    def test_seats_count_only_usable_keys(self):
        today = license_today()
        self._key("USE5", today + timedelta(days=30), users=10)
        self._key("OLD5", today - timedelta(days=1), users=50)
        from lmshub.core import seat_total
        self.assertEqual(seat_total(license_state(self.school_a)), 10)

    def test_licence_status_answer_uses_the_key_of_that_computer(self):
        today = license_today()
        old = self._key("OLD6", today - timedelta(days=1))
        new = self._key("NEW6", today + timedelta(days=30))
        api = Client()

        def ask(server):
            res = api.post("/api/v1/licensing/status", data={"installationId": server.installationId, "licenseId": "LIC-A"},
                           content_type="application/json")
            return res.json()["status"]

        self.assertEqual((ask(old), ask(new)), ("EXPIRED", "ACTIVE"))
        LmsServer.objects.filter(pk=new.pk).update(status=LmsServer.Status.DEACTIVATED)
        self.assertEqual(ask(new), "SUSPENDED")
