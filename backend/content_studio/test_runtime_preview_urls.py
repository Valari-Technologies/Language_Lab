from django.test import RequestFactory, SimpleTestCase

from .services.runtime_payload import absolutize_media_urls


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
