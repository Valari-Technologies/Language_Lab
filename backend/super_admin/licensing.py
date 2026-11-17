"""One definition of "expired" for LMS licences and LMS server keys.

A licence or key is valid through the END of its expiry day in the schools' time zone
(settings.LICENSE_UTC_OFFSET_MINUTES, India by default), not through the end of the UTC day.
"""
from datetime import datetime, time, timedelta, timezone as dt_timezone

from django.conf import settings
from django.utils import timezone


def license_today():
    """Today's date in the schools' time zone."""
    zone = timezone.get_fixed_timezone(settings.LICENSE_UTC_OFFSET_MINUTES)
    return timezone.now().astimezone(zone).date()


def is_past(expiry_date, today=None):
    """Whether the expiry day is over: true from the first moment of the day after it."""
    return bool(expiry_date) and expiry_date < (today or license_today())


def expiry_moment(expiry_date):
    """
    The exact moment after which a key with this expiry date no longer works, in UTC: the first moment after the END of
    its expiry day in the schools' time zone (a key that "expires on 5 Dec" works through 23:59:59 on 5 Dec there).
    "Expired" is `now >= expiry_moment(date)`; it is the same rule as `is_past`.
    """
    zone = timezone.get_fixed_timezone(settings.LICENSE_UTC_OFFSET_MINUTES)
    return datetime.combine(expiry_date + timedelta(days=1), time.min, tzinfo=zone).astimezone(dt_timezone.utc)


def key_expiry(server, license_obj=None):
    """The date an LMS server key stops working: its own expiry date, else the licence's."""
    if server.expiryDate:
        return server.expiryDate
    lic = license_obj or getattr(server, "license", None)
    return lic.expiryDate if lic else None


def mask_key(key):
    key = str(key or "")
    return f"{key[:8]}…{key[-4:]}" if len(key) > 12 else key
