from django.contrib.auth import get_user_model
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from super_admin.models import LmsServer, School

User = get_user_model()


class WelcomeEmailTests(APITestCase):
    def setUp(self):
        self.super_admin = User.objects.create_superuser(
            username="super_admin_mail", email="super_mail@example.com", password="testpassword123",
            role=User.Role.SUPER_ADMIN,
        )
        self.client.force_authenticate(user=self.super_admin)

    def test_welcome_email_has_credentials_and_installation_key(self):
        mail.outbox = []
        response = self.client.post(reverse("school-list"), {
            "name": "Mail Academy",
            "address": "1 Main St",
            "phone": "9876543210",
            "email": "contact@mailacademy.com",
            "admin_name": "Mail Admin",
            "admin_username": "mail_academy_admin",
            "admin_email": "admin@mailacademy.com",
            "admin_password": "securePass123!",
            "maxLmsServers": 2,
            "concurrentUsersPerServer": 40,
            "licenseDuration": "1 Year",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        server = LmsServer.objects.get(school=School.objects.get(school_name="Mail Academy"))
        self.assertTrue(server.licenseKey.startswith("LMS-KEY-"))
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.to, ["admin@mailacademy.com"])
        self.assertIn("Username: mail_academy_admin", message.body)
        self.assertIn("Password: securePass123!", message.body)
        self.assertIn(f"License Key: {server.licenseKey}", message.body)
        self.assertIn("User Capacity: 40 concurrent users", message.body)
        self.assertIn("Valid Until:", message.body)
