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

    def test_offline_data_carries_the_moment_the_key_stops_working(self):
        from super_admin.licensing import expiry_moment
        today = license_today()
        self._key("SOON7", today + timedelta(days=3))
        self._key("LATE7", today + timedelta(days=40))   # the latest expiry of the active keys is sent
        self._key("OFF7", today + timedelta(days=900), status=LmsServer.Status.DEACTIVATED)  # a disabled key never counts
        token = self.pair()
        body = self.get("offline-data", token).json()
        expected = expiry_moment(today + timedelta(days=40)).strftime("%Y-%m-%dT%H:%M:%SZ")
        self.assertEqual(body["licenseExpiresAt"], expected)
        self.assertRegex(body["licenseExpiresAt"], r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
        # a key that "expires on" 2026-12-05 works through the end of that day in India: 2026-12-05T18:30:00Z
        self.assertEqual(expiry_moment(datetime(2026, 12, 5).date()).strftime("%Y-%m-%dT%H:%M:%SZ"), "2026-12-05T18:30:00Z")

    def test_offline_data_without_keys_uses_the_licence_date(self):
        from super_admin.licensing import expiry_moment
        body = self.get("offline-data", self.pair()).json()
        self.assertEqual(body["licenseExpiresAt"],
                         expiry_moment(self.license_a.expiryDate).strftime("%Y-%m-%dT%H:%M:%SZ"))

    def test_online_and_offline_agree_at_the_exact_moment(self):
        from super_admin.licensing import expiry_moment
        day = datetime(2026, 12, 5).date()
        self._key("EDGE8", day)
        License.objects.filter(pk="LIC-A").update(expiryDate=day)
        token = self.pair()
        moment = expiry_moment(day)
        with mock.patch("super_admin.licensing.timezone.now", return_value=moment - timedelta(seconds=1)):
            self.assertEqual(self.get("status", token).json()["expired"], False)
            self.assertEqual(self.login(token, "AAR_1001").status_code, 200)
        with mock.patch("super_admin.licensing.timezone.now", return_value=moment):  # now >= licenseExpiresAt
            self.assertEqual(self.get("status", token).json()["expired"], True)
            response = self.login(token, "KAB_8001")
            self.assertEqual((response.status_code, response.json()["error"]), (403, "license_expired"))