from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from super_admin.models import Grade
from .models import Experience

User = get_user_model()


class SuperAdminLessonQueueOrderTests(TestCase):
    """Manage Lessons: lessons waiting for approval first, then rejected, approved last; newest first in each group."""

    def setUp(self):
        author = User.objects.create_user(username="author", password="x", role=User.Role.CONTENT_CREATOR)
        boss = User.objects.create_user(username="boss", password="x", role=User.Role.SUPER_ADMIN)
        self.grade = Grade.objects.create(grade_name="Grade 5", sort_order=5)
        self.author = author
        self.api = APIClient()
        self.api.force_authenticate(boss)

    def _lesson(self, title, status, age_days):
        lesson = Experience.objects.create(title=title, description="d", grade=self.grade, subject="English",
                                           language="English", difficulty="BEGINNER", estimated_duration=10,
                                           status=status, created_by=self.author)
        Experience.objects.filter(pk=lesson.pk).update(updated_at=timezone.now() - timedelta(days=age_days))
        return lesson

    def _titles(self, **params):
        response = self.api.get("/api/v1/super-admin/experiences/", params)
        self.assertEqual(response.status_code, 200)
        return [row["title"] for row in response.json()]

    def test_pending_first_then_rejected_and_approved_last(self):
        self._lesson("approved new", "APPROVED", 0)        # the most recently updated, yet it goes to the back
        self._lesson("pending old", "PENDING_APPROVAL", 5)
        self._lesson("rejected", "REJECTED", 1)
        self._lesson("pending new", "PENDING_APPROVAL", 2)
        self._lesson("approved old", "APPROVED", 9)
        self._lesson("a draft", "DRAFT", 0)                 # drafts are not in this list
        self.assertEqual(self._titles(), ["pending new", "pending old", "rejected", "approved new", "approved old"])

    def test_a_status_filter_still_works(self):
        self._lesson("approved", "APPROVED", 1)
        self._lesson("pending", "PENDING_APPROVAL", 1)
        self.assertEqual(self._titles(status="APPROVED"), ["approved"])