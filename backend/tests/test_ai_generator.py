import json
from unittest.mock import MagicMock, patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class AIGeneratorTests(APITestCase):
    def setUp(self):
        # Create user accounts for testing
        self.creator_user = User.objects.create_user(
            username="creator",
            email="creator@example.com",
            password="testpassword123",
            role="CONTENT_CREATOR"
        )
        self.student_user = User.objects.create_user(
            username="student",
            email="student@example.com",
            password="testpassword123",
            role="STUDENT"
        )
        self.url = reverse("cms-ai-generate")

    @patch("google.generativeai.GenerativeModel")
    def test_unauthenticated_request_fails(self, mock_model):
        response = self.client.post(self.url, {
            "topic": "Present Continuous Tense",
            "target_level": "Beginner",
            "content_type": "quiz"
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("google.generativeai.GenerativeModel")
    def test_unauthorized_user_fails(self, mock_model):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(self.url, {
            "topic": "Present Continuous Tense",
            "target_level": "Beginner",
            "content_type": "quiz"
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch("google.generativeai.GenerativeModel")
    def test_missing_params_fails(self, mock_model):
        self.client.force_authenticate(user=self.creator_user)
        response = self.client.post(self.url, {
            "topic": "Present Continuous Tense"
            # missing target_level and content_type
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Missing required fields", response.data["error"])

    @patch("google.generativeai.GenerativeModel")
    def test_invalid_content_type_fails(self, mock_model):
        self.client.force_authenticate(user=self.creator_user)
        response = self.client.post(self.url, {
            "topic": "Present Continuous Tense",
            "target_level": "Beginner",
            "content_type": "invalid_type"
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid content_type", response.data["error"])

    @patch("google.generativeai.GenerativeModel")
    @patch("google.generativeai.configure")
    def test_quiz_generation_success(self, mock_configure, mock_model_class):
        self.client.force_authenticate(user=self.creator_user)
        
        # Setup mock model response
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "title": "Present Continuous Quiz",
            "question": "What is she doing right now?",
            "options": ["She is run", "She is running", "She runs", "She running"],
            "correct_option_index": 1,
            "explanation": "Present continuous uses subject + am/is/are + verb-ing."
        })
        
        mock_model = MagicMock()
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model

        response = self.client.post(self.url, {
            "topic": "Present Continuous",
            "target_level": "Grade 5",
            "content_type": "quiz"
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Present Continuous Quiz")
        self.assertEqual(response.data["correct_option_index"], 1)
        mock_model.generate_content.assert_called_once()

    @patch("google.generativeai.GenerativeModel")
    @patch("google.generativeai.configure")
    def test_dialogue_generation_success(self, mock_configure, mock_model_class):
        self.client.force_authenticate(user=self.creator_user)

        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "title": "At the Airport",
            "dialogue_steps": [
                {"speaker": "Officer", "text": "Passport, please."},
                {"speaker": "Passenger", "text": "Here it is."}
            ]
        })

        mock_model = MagicMock()
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model

        response = self.client.post(self.url, {
            "topic": "Checking in at the airport",
            "target_level": "Intermediate",
            "content_type": "dialogue"
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "At the Airport")
        self.assertEqual(len(response.data["dialogue_steps"]), 2)

    @patch("google.generativeai.GenerativeModel")
    @patch("google.generativeai.configure")
    def test_gemini_invalid_json_handling(self, mock_configure, mock_model_class):
        self.client.force_authenticate(user=self.creator_user)

        mock_response = MagicMock()
        mock_response.text = "This is not valid JSON string"

        mock_model = MagicMock()
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model

        response = self.client.post(self.url, {
            "topic": "Present Tense",
            "target_level": "Beginner",
            "content_type": "quiz"
        })

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertIn("Invalid JSON returned from Gemini", response.data["error"])
