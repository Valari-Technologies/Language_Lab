from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from super_admin.models import Grade
from .models import Experience

User = get_user_model()


class LessonLayoutTests(TestCase):
    def setUp(self):
        self.author = User.objects.create_user(username="author", password="x", role=User.Role.CONTENT_CREATOR)
        grade = Grade.objects.create(grade_name="Grade 5", sort_order=5)
        self.lesson = Experience.objects.create(title="Five", description="d", grade=grade, subject="English",
                                                language="English", difficulty="BEGINNER", estimated_duration=10,
                                                status="DRAFT", created_by=self.author)
        self.api = APIClient()
        self.api.force_authenticate(self.author)
        self.url = f"/api/v1/content/experiences/{self.lesson.id}/layout/"
        self.layout = {"1": {"quiz": {"question": {"x": 10, "width": 300, "opacity": 90}}}}

    def test_save_and_read_back_and_carried_into_runtime_json(self):
        self.assertEqual(self.api.put(self.url, {"layout": self.layout}, format="json").status_code, 200)
        self.assertEqual(self.api.get(self.url).json(), {"layout": self.layout})
        data = self.api.get(f"/api/v1/content/experiences/{self.lesson.id}/preview/?runtime=1").json()
        self.assertEqual(data["layout"], self.layout)

    def test_runtime_json_has_no_layout_key_when_nothing_was_set(self):
        data = self.api.get(f"/api/v1/content/experiences/{self.lesson.id}/preview/?runtime=1").json()
        self.assertNotIn("layout", data)

    def test_bad_values_are_refused(self):
        bad = {"1": {"quiz": {"question": {"colour": 5}}}}
        self.assertEqual(self.api.put(self.url, {"layout": bad}, format="json").status_code, 400)
        bad = {"1": {"quiz": {"question": {"x": "10"}}}}
        self.assertEqual(self.api.put(self.url, {"layout": bad}, format="json").status_code, 400)

    def test_cannot_change_while_waiting_for_approval(self):
        self.lesson.status = Experience.Status.PENDING_APPROVAL
        self.lesson.save()
        self.assertEqual(self.api.put(self.url, {"layout": self.layout}, format="json").status_code, 400)
