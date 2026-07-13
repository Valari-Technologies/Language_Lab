from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from super_admin.models import Grade
from .models import Scenario, Activity, Screen, Media, Notification, ActivitySkill

User = get_user_model()


class ContentStudioAPITests(APITestCase):

    def setUp(self):
        # Create users
        self.super_admin = User.objects.create_user(
            username="super_admin", email="super@example.com", password="password123", role="SUPER_ADMIN"
        )
        self.content_creator = User.objects.create_user(
            username="content_creator", email="creator@example.com", password="password123", role="CONTENT_CREATOR"
        )
        self.school_admin = User.objects.create_user(
            username="school_admin", email="school@example.com", password="password123", role="SCHOOL_ADMIN"
        )
        self.teacher = User.objects.create_user(
            username="teacher", email="teacher@example.com", password="password123", role="TEACHER"
        )
        self.student = User.objects.create_user(
            username="student", email="student@example.com", password="password123", role="STUDENT"
        )

        # Create Grade
        self.grade3 = Grade.objects.create(grade_name="Grade 3", sort_order=3, description="Grade 3")
        self.grade4 = Grade.objects.create(grade_name="Grade 4", sort_order=4, description="Grade 4")

        # Create Scenarios
        self.scenario1 = Scenario.objects.create(
            title="Greetings - Level 1",
            description="Learn to say hello",
            grade=self.grade3,
            subject="English",
            language="English",
            difficulty=Scenario.Difficulty.EASY,
            estimated_duration=15,
            status=Scenario.Status.DRAFT,
            created_by=self.content_creator,
        )
        self.scenario2 = Scenario.objects.create(
            title="At the Restaurant",
            description="Ordering food",
            grade=self.grade4,
            subject="English",
            language="English",
            difficulty=Scenario.Difficulty.MEDIUM,
            estimated_duration=25,
            status=Scenario.Status.PUBLISHED,
            created_by=self.content_creator,
        )

        # Create Skills
        self.skill_speaking = ActivitySkill.objects.create(name="Speaking", description="Speaking skill")
        self.skill_listening = ActivitySkill.objects.create(name="Listening", description="Listening skill")

        # Create Activity
        self.activity1 = Activity.objects.create(
            scenario=self.scenario2,
            title="Dialogue with Waiter",
            description="Waiter conversation",
            learning_objective="Order food politely",
            estimated_duration=15,
            mastery_threshold=80,
            display_order=1,
        )
        self.activity1.skills.add(self.skill_speaking, self.skill_listening)

        # Create Screen
        self.screen1 = Screen.objects.create(
            activity=self.activity1,
            title="Welcome Screen",
            screen_type=Screen.ScreenType.INFORMATION,
            status=Screen.ScreenStatus.COMPLETE,
            display_order=1,
            content={"intro_text": "Welcome to the restaurant!"},
            estimated_duration=60,
        )

        # Create Media
        self.media1 = Media.objects.create(
            name="restaurant_scene.jpg",
            media_type=Media.MediaType.IMAGE,
            file_size=2048,
            folder="Images",
            uploaded_by=self.content_creator,
        )

        # Create Notification
        self.notification1 = Notification.objects.create(
            title="System Maintenance",
            message="Maintenance on May 25",
            notification_type=Notification.NotificationType.INFO,
            user=self.content_creator,
        )

    def test_anonymous_access_denied(self):
        """Anonymous requests should return 401 Unauthorized."""
        response = self.client.get(reverse("scenario-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_allowed_roles_forbidden(self):
        """School Admin, Teacher, and Student roles should receive 403 Forbidden."""
        for user in [self.school_admin, self.teacher, self.student]:
            self.client.force_authenticate(user=user)
            response = self.client.get(reverse("scenario-list"))
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, f"Failed for {user.username}")

    def test_content_creator_and_super_admin_allowed(self):
        """Content Creator and Super Admin roles should receive 200 OK."""
        for user in [self.content_creator, self.super_admin]:
            self.client.force_authenticate(user=user)
            response = self.client.get(reverse("scenario-list"))
            self.assertEqual(response.status_code, status.HTTP_200_OK, f"Failed for {user.username}")

    def test_experiences_list_filtering(self):
        """Verify list endpoint filtering by grade, status, and search."""
        self.client.force_authenticate(user=self.content_creator)

        # Check search
        response = self.client.get(reverse("scenario-list"), {"search": "Waiter"})
        self.assertEqual(len(response.data["results"]), 0)  # "Waiter" is not in Scenario title/description

        response = self.client.get(reverse("scenario-list"), {"search": "Restaurant"})
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "At the Restaurant")

        # Check grade filter
        response = self.client.get(reverse("scenario-list"), {"grade": self.grade3.id})
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "Greetings - Level 1")

        # Check status filter
        response = self.client.get(reverse("scenario-list"), {"status": "PUBLISHED"})
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "At the Restaurant")

    def test_experience_detail_nested_activities(self):
        """Detail endpoint should return nested activities."""
        self.client.force_authenticate(user=self.content_creator)
        response = self.client.get(reverse("scenario-detail", args=[self.scenario2.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("activities", response.data)
        self.assertEqual(len(response.data["activities"]), 1)
        self.assertEqual(response.data["activities"][0]["title"], "Dialogue with Waiter")

    def test_activity_detail_nested_screens(self):
        """Activity detail endpoint should return nested screens."""
        self.client.force_authenticate(user=self.content_creator)
        response = self.client.get(reverse("activity-detail", args=[self.activity1.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("screens", response.data)
        self.assertEqual(len(response.data["screens"]), 1)
        self.assertEqual(response.data["screens"][0]["title"], "Welcome Screen")

    def test_activity_screens_subpath(self):
        """GET /api/v1/content/activities/{id}/screens should return all screens for the activity."""
        self.client.force_authenticate(user=self.content_creator)
        url = reverse("activity-screens", args=[self.activity1.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Welcome Screen")

    def test_screen_detail(self):
        """GET /api/v1/content/screens/{id} should return screen details."""
        self.client.force_authenticate(user=self.content_creator)
        response = self.client.get(reverse("screen-detail", args=[self.screen1.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Welcome Screen")

    def test_media_usage(self):
        """GET /api/v1/content/media/{id}/usage should report where media is used."""
        self.client.force_authenticate(user=self.content_creator)
        
        # Test unused media
        response = self.client.get(reverse("media-usage", args=[self.media1.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

        # Update screen content to reference the media file
        self.screen1.content = {"image_reference": "restaurant_scene.jpg"}
        self.screen1.save()

        # Re-fetch media usage
        response = self.client.get(reverse("media-usage", args=[self.media1.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["screen_title"], "Welcome Screen")

    def test_dashboard_endpoints(self):
        """Verify summary, recent-experiences, recent-activity, and notifications endpoints."""
        self.client.force_authenticate(user=self.content_creator)

        # Summary
        response = self.client.get(reverse("dashboard-summary"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_scenarios"], 2)
        self.assertEqual(response.data["draft_scenarios"], 1)
        self.assertEqual(response.data["published_scenarios"], 1)
        self.assertEqual(response.data["total_media_assets"], 1)

        # Recent Experiences
        response = self.client.get(reverse("dashboard-recent-scenarios"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        # Recent Activity
        response = self.client.get(reverse("dashboard-recent-activity"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

        # Notifications
        response = self.client.get(reverse("dashboard-notifications"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "System Maintenance")

    def test_write_methods_not_allowed(self):
        """All write HTTP methods should be rejected on ReadOnly ViewSets and generic APIViews."""
        self.client.force_authenticate(user=self.content_creator)

        # POST on list
        response = self.client.post(reverse("scenario-list"), {"title": "New"})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # PUT on detail
        response = self.client.put(reverse("scenario-detail", args=[self.scenario1.id]), {"title": "Updated"})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # DELETE on detail
        response = self.client.delete(reverse("scenario-detail", args=[self.scenario1.id]))
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
