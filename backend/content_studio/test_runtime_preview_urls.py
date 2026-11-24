from django.contrib.auth import get_user_model
from django.test import RequestFactory, SimpleTestCase, TestCase
from rest_framework.test import APIClient

from super_admin.models import Grade
from .models import Experience
from .services.runtime_payload import absolutize_media_urls

User = get_user_model()


class RuntimePreviewEndpointTests(TestCase):
    """The LMS Engine preview asks for ?runtime=1 (not ?format=, which Django REST Framework reserves and answers 404)."""

    def test_runtime_json_is_returned(self):
        author = User.objects.create_user(username="author", password="x", role=User.Role.CONTENT_CREATOR)
        grade = Grade.objects.create(grade_name="Grade 5", sort_order=5)
        lesson = Experience.objects.create(title="Five", description="d", grade=grade, subject="English",
                                           language="English", difficulty="BEGINNER", estimated_duration=10,
                                           status="DRAFT", created_by=author)
        api = APIClient()
        api.force_authenticate(author)
        response = api.get(f"/api/v1/content/experiences/{lesson.id}/preview/?runtime=1")
        self.assertEqual(response.status_code, 200, response.content)
        data = response.json()
        self.assertEqual((data["title"], data["id"]), ("Five", str(lesson.id)))
        self.assertIn("activities", data)
        # the normal preview is unchanged
        normal = api.get(f"/api/v1/content/experiences/{lesson.id}/preview/").json()
        self.assertIn("experience", normal)


class AbsolutizeMediaUrlsTests(SimpleTestCase):
    def setUp(self):
        self.request = RequestFactory().get("/api/v1/content/experiences/1/preview/", HTTP_HOST="cms.example.com")

    def test_media_paths_anywhere_become_full_urls(self):
        data = {"content": {"elements": [{"type": "drag_drop", "content": {"pairs": [
            {"source": "", "sourceImage": "/media/media_library/a.png", "source_image": "/media/media_library/a.png"},
        ]}}]}, "list": ["/media/x.mp3", "plain"]}
        out = absolutize_media_urls(data, self.request)
        pair = out["content"]["elements"][0]["content"]["pairs"][0]
        self.assertEqual(pair["sourceImage"], "http://cms.example.com/media/media_library/a.png")
        self.assertEqual(pair["source_image"], "http://cms.example.com/media/media_library/a.png")
        self.assertEqual(out["list"], ["http://cms.example.com/media/x.mp3", "plain"])

    def test_other_values_and_full_urls_are_untouched_and_input_is_not_changed(self):
        data = {"a": "https://other.example/media/y.png", "b": "text /media/ inside", "c": 5, "d": None, "e": "/media/z.png"}
        out = absolutize_media_urls(data, self.request)
        self.assertEqual(out["a"], "https://other.example/media/y.png")
        self.assertEqual(out["b"], "text /media/ inside")
        self.assertEqual((out["c"], out["d"]), (5, None))
        self.assertEqual(data["e"], "/media/z.png")
