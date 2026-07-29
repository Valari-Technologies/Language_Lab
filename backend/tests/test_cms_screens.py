"""
CMS Test 1 & 2 — Screen content JSON integrity and API response validity.

Test 1: Creating/updating a Screen with a complex JSON payload (heading, audio
        URLs, dialogue steps, quiz options, plus special characters) round-trips
        through the database with zero truncation, corruption, or re-encoding.
Test 2: The screens list/detail API endpoints return HTTP 200 with clean,
        un-escaped JSON — no double-encoding of quotes/apostrophes/unicode.
"""
import pytest
from django.urls import reverse
from rest_framework import status

from content_studio.models import Screen

pytestmark = pytest.mark.django_db

# A deliberately complex payload: a heading, an audio block with a URL, a
# multi-step dialogue, and a quiz with several options — including special
# characters (apostrophes, double quotes, unicode, embedded newlines) that
# commonly trigger JSON escaping or DB truncation bugs.
COMPLEX_SCREEN_CONTENT = {
    "blocks": [
        {
            "type": "heading",
            "tag": "H1",
            "text": "Let's Learn: \"Greetings\" & Everyday Phrases — café ✔",
        },
        {
            "type": "audio",
            "url": "https://cdn.example.com/audio/greetings_intro.mp3?token=abc&v=2",
            "caption": "Listen carefully, it's a 30-second clip.",
        },
        {
            "type": "dialogue",
            "steps": [
                {"step": 1, "speaker": "Ben", "text": "Hi! What's your name?", "side": "left"},
                {"step": 2, "speaker": "Aya", "text": "I'm Aya. Nice to meet you!\nHow about you?", "side": "right"},
                {"step": 3, "speaker": "Ben", "text": "I’m Ben — the \"new\" student.", "side": "left"},
            ],
        },
        {
            "type": "quiz",
            "question": "Which greeting means \"hello\" in French?",
            "options": ["Bonjour", "Au revoir", "Merci", "S'il vous plaît"],
            "correct_answer_index": 0,
        },
    ],
}


@pytest.fixture
def screen(activity):
    return Screen.objects.create(
        activity=activity,
        title="Greetings Intro",
        screen_type=Screen.ScreenType.INFORMATION,
        display_order=1,
        content=COMPLEX_SCREEN_CONTENT,
        estimated_duration=60,
    )


class TestScreenComplexJSONPersistence:
    """Test 1: complex JSON payload saves cleanly, without truncation or corruption."""

    def test_create_screen_with_complex_json_persists_exactly(self, authenticated_client, activity):
        url = reverse("screen-list")
        payload = {
            "activity": activity.id,
            "title": "Greetings Intro (Created via API)",
            "screen_type": Screen.ScreenType.INFORMATION,
            "estimated_duration": 60,
            "content": COMPLEX_SCREEN_CONTENT,
        }

        response = authenticated_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED, response.data

        created_screen = Screen.objects.get(id=response.data["id"])
        # Byte-for-byte equality against the original dict — catches silent
        # truncation, re-serialization corruption, or lossy encoding.
        assert created_screen.content == COMPLEX_SCREEN_CONTENT

        # Spot-check the trickiest strings individually so a failure points
        # straight at the offending field instead of a vague dict diff.
        heading = created_screen.content["blocks"][0]
        assert heading["text"] == "Let's Learn: \"Greetings\" & Everyday Phrases — café ✔"

        dialogue_steps = created_screen.content["blocks"][2]["steps"]
        assert dialogue_steps[1]["text"] == "I'm Aya. Nice to meet you!\nHow about you?"
        assert "\n" in dialogue_steps[1]["text"], "Embedded newline must survive the round-trip"

        quiz = created_screen.content["blocks"][3]
        assert quiz["options"] == ["Bonjour", "Au revoir", "Merci", "S'il vous plaît"]

    def test_update_screen_with_complex_json_persists_exactly(self, authenticated_client, screen):
        url = reverse("screen-detail", args=[screen.id])

        updated_content = {
            **COMPLEX_SCREEN_CONTENT,
            "blocks": COMPLEX_SCREEN_CONTENT["blocks"] + [
                {
                    "type": "quiz",
                    "question": 'Translate: "Where\'s the café?"',
                    "options": ["Où est le café ?", "Comment ça va ?"],
                    "correct_answer_index": 0,
                }
            ],
        }

        response = authenticated_client.patch(url, {"content": updated_content}, format="json")

        assert response.status_code == status.HTTP_200_OK, response.data

        screen.refresh_from_db()
        assert screen.content == updated_content
        assert len(screen.content["blocks"]) == 5
        assert screen.content["blocks"][4]["question"] == 'Translate: "Where\'s the café?"'


class TestScreenAPIResponseValidity:
    """Test 2: GET endpoints return HTTP 200 with valid, un-escaped JSON."""

    def test_screen_list_returns_200_with_clean_json(self, authenticated_client, screen):
        url = reverse("screen-list")
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"].startswith("application/json")

        results = response.data["results"] if "results" in response.data else response.data
        matching = [s for s in results if s["id"] == screen.id]
        assert len(matching) == 1

        content = matching[0]["content"]
        heading_text = content["blocks"][0]["text"]
        # If the API were double-encoding JSON, this would come back as a
        # string containing literal backslashes (e.g. \\" or \\u2014) instead
        # of the real characters.
        assert "\\\"" not in heading_text
        assert "\\u" not in heading_text
        assert heading_text == "Let's Learn: \"Greetings\" & Everyday Phrases — café ✔"

    def test_screen_detail_returns_200_with_clean_json(self, authenticated_client, screen):
        url = reverse("screen-detail", args=[screen.id])
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == screen.id
        assert response.data["content"] == COMPLEX_SCREEN_CONTENT

        dialogue_steps = response.data["content"]["blocks"][2]["steps"]
        assert dialogue_steps[1]["text"] == "I'm Aya. Nice to meet you!\nHow about you?"

    def test_screen_endpoints_reject_unauthenticated_access(self, api_client, screen):
        response = api_client.get(reverse("screen-list"))
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
