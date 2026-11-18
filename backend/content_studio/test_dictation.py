import json

from django.contrib.auth import get_user_model
from django.test import TestCase

from super_admin.models import Grade
from .models import Activity, Experience, Screen
from .services.dictation import dictation_items, tracks_without_text
from .services.runtime_contact import build_runtime_experience
from .services.runtime_payload import build_runtime_payload
from .validation_engine import run_validation_engine

User = get_user_model()
RULE = "dictation_correct_text_required"


class DictationCorrectTextTests(TestCase):
    """A typing Dictation card needs its Correct text to be published, and the package carries it as items[].targetText."""

    def setUp(self):
        author = User.objects.create_user(username="author", password="x", role=User.Role.CONTENT_CREATOR)
        grade = Grade.objects.create(grade_name="Grade 3", sort_order=3)
        self.experience = Experience.objects.create(
            title="Greetings", description="Hello", grade=grade, subject="English", language="English",
            difficulty=Experience.Difficulty.BEGINNER, estimated_duration=15, created_by=author)
        self.activity = Activity.objects.create(experience=self.experience, title="Listen", estimated_duration=5, display_order=1)

    def _card(self, content, title="Dictation 1"):
        element = {"id": "block-1", "type": "dictation", "content": content}
        return Screen.objects.create(activity=self.activity, title=title, screen_type=Screen.ScreenType.INFORMATION,
                                     display_order=self.activity.screens.count() + 1, estimated_duration=60,
                                     content={"elements": [element], "text": "x"})

    def _rule(self):
        report = run_validation_engine(self.experience)
        return report, [r for r in report["results"] if r["rule"] == RULE]

    def test_an_empty_correct_text_blocks_publishing(self):
        self._card({"question": "Listen.", "items": [{"id": "dict-1", "audioUrl": "/media/media_library/a.mp3", "text": "  "}]})
        report, found = self._rule()
        self.assertEqual([r["severity"] for r in found], ["ERROR"])
        self.assertIn("Correct text", found[0]["message"])
        self.assertEqual(report["status"], "FAILED")  # the publish gate refuses a FAILED report

    def test_every_track_needs_its_text(self):
        self._card({"items": [{"audioUrl": "/media/a.mp3", "text": "Hi"}, {"audioUrl": "/media/b.mp3", "text": ""}]})
        self.assertIn("#2", self._rule()[1][0]["message"])

    def test_a_card_with_its_text_passes(self):
        self._card({"items": [{"audioUrl": "/media/a.mp3", "text": "Hi, hello! How are you?"}]})
        self.assertEqual([r["severity"] for r in self._rule()[1]], ["PASSED"])

    def test_an_older_card_with_the_text_in_the_content_passes_and_without_it_fails(self):
        self._card({"url": "/media/a.mp3", "targetText": "Good morning"}, title="old with text")
        self._card({"url": "/media/b.mp3"}, title="old without text")
        self.assertEqual(sorted(r["severity"] for r in self._rule()[1]), ["ERROR", "PASSED"])

    def test_a_quiz_mode_card_needs_no_text(self):
        self._card({"responseType": "quiz", "options": ["A", "B"], "correctAnswer": 0,
                    "items": [{"audioUrl": "/media/a.mp3", "text": ""}]})
        self.assertEqual([r["severity"] for r in self._rule()[1]], ["PASSED"])
        self.assertEqual(tracks_without_text({"responseType": "quiz", "items": [{"text": ""}]}), [])

    def test_the_package_carries_url_question_and_target_text(self):
        self._card({"question": "", "items": [{"id": "dict-1", "audioUrl": "/media/media_library/xxxx.mp3",
                                               "text": "  Hi, hello! How are you?  "}]})
        payload = build_runtime_payload(self.experience)
        contract = build_runtime_experience(self.experience, payload)
        card = contract["activities"][0]["screens"][0]["content"]["elements"][0]
        self.assertEqual(card["type"], "dictation")
        self.assertEqual(card["content"]["url"], "/media/media_library/xxxx.mp3")
        self.assertEqual(card["content"]["question"], "")
        self.assertEqual(card["content"]["items"][0]["targetText"], "Hi, hello! How are you?")
        # the preview / LMS payload carries the same fields
        element = payload["activities"][0]["screens"][0]["elements"][0]
        self.assertEqual(element["content"]["items"][0]["targetText"], "Hi, hello! How are you?")
        self.assertEqual(element["content"]["url"], "/media/media_library/xxxx.mp3")
        print("\nDICTATION CARD IN experience.json:\n" + json.dumps({"type": card["type"], "content": {
            "url": card["content"]["url"], "question": card["content"]["question"],
            "items": [{"targetText": i["targetText"]} for i in card["content"]["items"]]}}, indent=2))

    def test_an_older_single_audio_card_gets_items(self):
        items = dictation_items({"url": "/media/a.mp3", "text": "Good morning"})
        self.assertEqual((items[0]["audioUrl"], items[0]["targetText"]), ("/media/a.mp3", "Good morning"))
