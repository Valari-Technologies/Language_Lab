"""Settings used only by the automated test suite."""

from .settings import *  # noqa: F403


# Production-grade password hashing is intentionally expensive. Tests verify
# authentication behavior, not hashing cost, so use Django's fast test hasher.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
