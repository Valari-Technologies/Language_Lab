from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from super_admin.models import Grade
from .models import Experience, PublishedPackage, PublishVersion

User = get_user_model()


class PackageNameUsedOnceTests(TestCase):
    """Publishing a lesson is refused while another lesson already owns its package name (the lesson title)."""

    def setUp(self):
        self.author = User.objects.create_user(username="author", password="x", role=User.Role.CONTENT_CREATOR)
        self.grade = Grade.objects.create(grade_name="Grade 5", sort_order=5)
        self.api = APIClient()
        self.api.force_authenticate(self.author)

    def _lesson(self, title, status="DRAFT"):
        return Experience.objects.create(title=title, description="d", grade=self.grade, subject="English",
                                         language="English", difficulty="BEGINNER", estimated_duration=10,
                                         status=status, created_by=self.author)

    def _publish(self, lesson):
        return self.api.post(f"/api/v1/content/publish/{lesson.id}/", {"version": "1.0"}, format="json")

    def _blocked(self, response):
        return response.status_code == 409 and response.json().get("code") == "package_name_exists"

    def test_a_lesson_waiting_for_approval_or_approved_owns_its_name(self):
        for status in ("PENDING_APPROVAL", "APPROVED"):
            Experience.objects.all().delete()
            self._lesson("Five1", status=status)
            second = self._lesson("Five1")
            response = self._publish(second)
            self.assertTrue(self._blocked(response), (status, response.status_code, response.content))
            self.assertIn('A package named "Five1" already exists', response.json()["error"])

    def test_the_name_is_compared_without_case_or_edge_spaces(self):
        self._lesson("Five1", status="APPROVED")
        self.assertTrue(self._blocked(self._publish(self._lesson("  five1 "))))

    def test_a_lesson_with_a_build_owns_its_name(self):
        first = self._lesson("Seven")
        package = PublishedPackage.objects.create(experience=first, package_name="Seven", compression_status="COMPLETED")
        PublishVersion.objects.create(published_package=package, version_number="1.0", build_number=1, package_size=1,
                                      published_by=self.author)
        self.assertTrue(self._blocked(self._publish(self._lesson("Seven"))))

    def test_other_names_drafts_deleted_lessons_and_the_lesson_itself_are_not_blocked(self):
        self._lesson("Six", status="APPROVED")
        self.assertFalse(self._blocked(self._publish(self._lesson("Seven"))))                 # another name
        self._lesson("Eight")                                                                  # a draft does not own the name
        self.assertFalse(self._blocked(self._publish(self._lesson("Eight"))))
        gone = self._lesson("Nine", status="APPROVED")
        Experience.objects.filter(pk=gone.pk).update(is_deleted=True)                         # a deleted lesson is ignored
        self.assertFalse(self._blocked(self._publish(self._lesson("Nine"))))
        mine = self._lesson("Ten", status="APPROVED")                                          # publishing another version of itself
        self.assertFalse(self._blocked(self._publish(mine)))
