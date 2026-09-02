from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from super_admin.models import Grade
from .models import Experience, Activity, Screen, Media, Notification, ActivitySkill, LearningOutcome, ValidationReport

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

        # Create Experiences
        self.experience1 = Experience.objects.create(
            title="Greetings - Level 1",
            description="Learn to say hello",
            grade=self.grade3,
            subject="English",
            language="English",
            difficulty=Experience.Difficulty.BEGINNER,
            estimated_duration=15,
            status=Experience.Status.DRAFT,
            created_by=self.content_creator,
        )
        self.experience2 = Experience.objects.create(
            title="At the Restaurant",
            description="Ordering food",
            grade=self.grade4,
            subject="English",
            language="English",
            difficulty=Experience.Difficulty.INTERMEDIATE,
            estimated_duration=25,
            status=Experience.Status.APPROVED,
            created_by=self.content_creator,
        )

        # Create Skills
        self.skill_speaking = ActivitySkill.objects.create(name="Speaking", description="Speaking skill")
        self.skill_listening = ActivitySkill.objects.create(name="Listening", description="Listening skill")

        # Create Activity
        self.activity1 = Activity.objects.create(
            experience=self.experience2,
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
        response = self.client.get(reverse("experience-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_allowed_roles_allowed_to_list(self):
        """School Admin, Teacher, and Student roles should receive 200 OK to list experiences."""
        for user in [self.school_admin, self.teacher, self.student]:
            self.client.force_authenticate(user=user)
            response = self.client.get(reverse("experience-list"))
            self.assertEqual(response.status_code, status.HTTP_200_OK, f"Failed for {user.username}")

    def test_content_creator_and_super_admin_allowed(self):
        """Content Creator role should receive 200 OK."""
        self.client.force_authenticate(user=self.content_creator)
        response = self.client.get(reverse("experience-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_super_admin_allowed_in_content_studio(self):
        """Super Admin role should receive 200 OK in Content Studio list."""
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.get(reverse("experience-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_super_admin_experiences_list_filtering(self):
        """Verify super-admin/experiences/ list filtering by grade, status."""
        self.client.force_authenticate(user=self.super_admin)
        
        response = self.client.get(reverse("super-admin-experiences-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.experience2.id)

        response = self.client.get(reverse("super-admin-experiences-list"), {"grade": self.grade4.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.experience2.id)

        response = self.client.get(reverse("super-admin-experiences-list"), {"grade": self.grade3.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

        response = self.client.get(reverse("super-admin-experiences-list"), {"status": "DRAFT", "grade": self.grade3.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.experience1.id)

    def test_experiences_list_filtering(self):
        """Verify list endpoint filtering by grade, status, and search."""
        self.client.force_authenticate(user=self.content_creator)

        # Create activity and screen for experience1 so it isn't excluded as incomplete draft
        act = Activity.objects.create(experience=self.experience1, title="Intro Act", estimated_duration=5, display_order=1)
        Screen.objects.create(activity=act, title="Intro Screen", screen_type=Screen.ScreenType.INFORMATION, estimated_duration=60, display_order=1)

        # Check search
        response = self.client.get(reverse("experience-list"), {"search": "Waiter"})
        self.assertEqual(len(response.data["results"]), 0)  # "Waiter" is not in Experience title/description

        response = self.client.get(reverse("experience-list"), {"search": "Restaurant"})
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "At the Restaurant")

        # Check grade filter
        response = self.client.get(reverse("experience-list"), {"grade": self.grade3.id})
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "Greetings - Level 1")

        # Check status filter
        response = self.client.get(reverse("experience-list"), {"status": "APPROVED"})
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "At the Restaurant")

    def test_experience_detail_nested_activities(self):
        """Detail endpoint should return nested activities."""
        self.client.force_authenticate(user=self.content_creator)
        response = self.client.get(reverse("experience-detail", args=[self.experience2.id]))
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
        self.assertEqual(response.data["total_experiences"], 2)
        self.assertEqual(response.data["draft_experiences"], 1)
        self.assertEqual(response.data["published_experiences"], 1)
        self.assertEqual(response.data["total_media_assets"], 1)

        # Recent Experiences
        response = self.client.get(reverse("dashboard-recent-experiences"))
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

        # POST on list of a read-only endpoint (media list POST is disabled)
        response = self.client.post(reverse("media-list"), {"name": "New"})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # POST on a read-only generic APIView (dashboard-summary)
        response = self.client.post(reverse("dashboard-summary"), {"name": "New"})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_create_experience_success(self):
        """Content Creator can create a experience. created_by is set automatically."""
        self.client.force_authenticate(user=self.content_creator)
        payload = {
            "title": "New Grammar Lesson",
            "description": "Learn verbs",
            "grade": self.grade3.id,
            "subject": "Grammar",
            "language": "English",
            "difficulty": "INTERMEDIATE",
            "estimated_duration": 20,
            "status": "DRAFT",
            "tags": ["grammar", "verbs"]
        }
        response = self.client.post(reverse("experience-list"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "New Grammar Lesson")
        self.assertEqual(response.data["created_by"], self.content_creator.id)

    def test_create_experience_validation_reject_extra_fields(self):
        """Reject request if unknown or extra fields are passed."""
        self.client.force_authenticate(user=self.content_creator)
        payload = {
            "title": "New Grammar Lesson",
            "grade": self.grade3.id,
            "subject": "Grammar",
            "language": "English",
            "estimated_duration": 20,
            "status": "DRAFT",
            "extra_unsupported_field": "some_value"
        }
        response = self.client.post(reverse("experience-list"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("extra_unsupported_field", response.data)

    def test_create_experience_validation_reject_created_by(self):
        """Reject setting created_by from the request body."""
        self.client.force_authenticate(user=self.content_creator)
        payload = {
            "title": "New Grammar Lesson",
            "grade": self.grade3.id,
            "subject": "Grammar",
            "language": "English",
            "estimated_duration": 20,
            "status": "DRAFT",
            "created_by": self.super_admin.id
        }
        response = self.client.post(reverse("experience-list"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("created_by", response.data)

    def test_update_experience_success(self):
        """Content Creator can perform full update on a experience."""
        self.client.force_authenticate(user=self.content_creator)
        payload = {
            "title": "Greetings Updated",
            "description": "Learn to say hello and goodbye",
            "grade": self.grade4.id,
            "subject": "English",
            "language": "English",
            "difficulty": "BEGINNER",
            "estimated_duration": 18,
            "status": "DRAFT",
            "tags": ["greetings"]
        }
        response = self.client.put(reverse("experience-detail", args=[self.experience1.id]), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Greetings Updated")

    def test_patch_experience_success(self):
        """Content Creator can partially update a experience."""
        self.client.force_authenticate(user=self.content_creator)
        payload = {
            "title": "Greetings Patched"
        }
        response = self.client.patch(reverse("experience-detail", args=[self.experience1.id]), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Greetings Patched")

    def test_delete_experience_soft_delete(self):
        """DELETE request soft-deletes a experience and excludes it from queries."""
        self.client.force_authenticate(user=self.content_creator)
        response = self.client.delete(reverse("experience-detail", args=[self.experience1.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Ensure it is excluded from list view
        list_response = self.client.get(reverse("experience-list"))
        self.assertEqual(len(list_response.data["results"]), 1)  # Only experience2 remains
        
        # Ensure it returns 404 on detail view
        detail_response = self.client.get(reverse("experience-detail", args=[self.experience1.id]))
        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_duplicate_experience(self):
        """Verify deep copying of experience and its nested activities/screens."""
        self.client.force_authenticate(user=self.content_creator)
        url = reverse("experience-duplicate", args=[self.experience2.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], f"{self.experience2.title} (Copy)")
        self.assertEqual(response.data["status"], "DRAFT")
        self.assertEqual(response.data["created_by"], self.content_creator.id)

        # Verify deep copy of nested activities & screens in DB
        new_experience_id = response.data["id"]
        new_experience = Experience.objects.get(id=new_experience_id)
        self.assertEqual(new_experience.activities.count(), 1)
        
        new_activity = new_experience.activities.first()
        self.assertEqual(new_activity.title, self.activity1.title)
        self.assertEqual(new_activity.screens.count(), 1)
        self.assertEqual(new_activity.screens.first().title, self.screen1.title)
        
        # Verify skills are copied / associated
        self.assertEqual(new_activity.skills.count(), 2)

    def test_archive_experience(self):
        """POST to archive changes experience status to REJECTED."""
        self.client.force_authenticate(user=self.content_creator)
        url = reverse("experience-archive", args=[self.experience1.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "REJECTED")

    def test_publish_experience(self):
        """POST to publish changes experience status to PENDING_APPROVAL."""
        self.client.force_authenticate(user=self.content_creator)
        url = reverse("experience-publish", args=[self.experience1.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "PENDING_APPROVAL")

    def test_school_admin_cannot_write_experience(self):
        """School Admin gets 403 Forbidden on writes."""
        self.client.force_authenticate(user=self.school_admin)
        
        # Create
        response = self.client.post(reverse("experience-list"), {"title": "Forbidden"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Update
        response = self.client.put(reverse("experience-detail", args=[self.experience1.id]), {"title": "Forbidden"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Delete
        response = self.client.delete(reverse("experience-detail", args=[self.experience1.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_activity_crud_operations(self):
        """Verify activity create, update, patch, delete, and list-scoped-to-experience."""
        self.client.force_authenticate(user=self.content_creator)

        # Create
        payload = {
            "experience": self.experience1.id,
            "title": "New Activity 2",
            "description": "desc",
            "estimated_duration": 10,
            "mastery_threshold": 80,
            "skill_ids": [self.skill_speaking.id]
        }
        response = self.client.post(reverse("activity-list"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Speaking")
        # display_order should be auto-assigned to 1 since experience1 has no other activities
        self.assertEqual(response.data["display_order"], 1)
        new_act_id = response.data["id"]

        # List scoped to experience1
        url = reverse("experience-activities", args=[self.experience1.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], new_act_id)

        # Update
        payload["title"] = "New Activity 2 Updated"
        response = self.client.put(reverse("activity-detail", args=[new_act_id]), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Speaking")

        # Patch
        response = self.client.patch(reverse("activity-detail", args=[new_act_id]), {"title": "New Activity 2 Patched"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "New Activity 2 Patched")

        # Delete (should delete, checking cascade: screens should be deleted if any existed)
        # Create a screen under it first to verify cascade hard delete
        screen_payload = {
            "activity": new_act_id,
            "title": "Cascade Screen",
            "screen_type": "INFORMATION",
            "status": "NOT_STARTED",
            "estimated_duration": 30,
            "content": {"text": "hello"}
        }
        scr_resp = self.client.post(reverse("screen-list"), screen_payload, format="json")
        self.assertEqual(scr_resp.status_code, status.HTTP_201_CREATED)
        scr_id = scr_resp.data["id"]

        # Delete activity
        del_response = self.client.delete(reverse("activity-detail", args=[new_act_id]))
        self.assertEqual(del_response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify activity doesn't exist
        self.assertEqual(Activity.objects.filter(id=new_act_id).count(), 0)
        # Verify screen is cascade-deleted
        self.assertEqual(Screen.objects.filter(id=scr_id).count(), 0)

    def test_activity_create_rejects_deleted_parent(self):
        """Creating an activity under a soft-deleted experience should return 400."""
        self.client.force_authenticate(user=self.content_creator)
        # Soft-delete experience1 first
        self.experience1.is_deleted = True
        self.experience1.save()

        payload = {
            "experience": self.experience1.id,
            "title": "Invalid Activity",
            "estimated_duration": 10,
            "mastery_threshold": 80
        }
        response = self.client.post(reverse("activity-list"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("experience", response.data)

    def test_activity_duration_exceeds_experience_limit(self):
        """Verify activity creation fails if total duration exceeds experience estimated_duration."""
        self.client.force_authenticate(user=self.content_creator)
        # experience1 estimated_duration = 15
        payload = {
            "experience": self.experience1.id,
            "title": "Overlong Activity",
            "estimated_duration": 20,
            "mastery_threshold": 80
        }
        response = self.client.post(reverse("activity-list"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("estimated_duration", response.data)

    def test_activity_reorder_and_integrity(self):
        """Verify atomic activities reordering within same experience, and same-parent constraint."""
        self.client.force_authenticate(user=self.content_creator)

        # Create two activities under experience1
        act1 = Activity.objects.create(experience=self.experience1, title="Act 1", estimated_duration=5, display_order=1)
        act2 = Activity.objects.create(experience=self.experience1, title="Act 2", estimated_duration=5, display_order=2)

        # Reorder payload
        reorder_url = reverse("activity-reorder")
        payload = {"ids": [act2.id, act1.id]}
        response = self.client.patch(reorder_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify ordering updated
        act1.refresh_from_db()
        act2.refresh_from_db()
        self.assertEqual(act2.display_order, 1)
        self.assertEqual(act1.display_order, 2)

        # Integrity check: try to reorder with an activity from experience2
        act_other = Activity.objects.create(experience=self.experience2, title="Other Experience Act", estimated_duration=5, display_order=2)
        payload_invalid = {"ids": [act2.id, act_other.id]}
        response_invalid = self.client.patch(reorder_url, payload_invalid, format="json")
        self.assertEqual(response_invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response_invalid.data)

    def test_screen_crud_operations(self):
        """Verify screen create, update, patch, delete, and duplicate."""
        self.client.force_authenticate(user=self.content_creator)

        # Create
        payload = {
            "activity": self.activity1.id,
            "title": "New Screen 2",
            "screen_type": "QUIZ",
            "status": "NOT_STARTED",
            "estimated_duration": 45,
            "content": {"question": "What is 1+1?"}
        }
        response = self.client.post(reverse("screen-list"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "New Screen 2")
        # display_order should auto-assign to 2 since activity1 already has 1 screen
        self.assertEqual(response.data["display_order"], 2)
        new_scr_id = response.data["id"]

        # Duplicate
        dup_url = reverse("screen-duplicate", args=[new_scr_id])
        dup_response = self.client.post(dup_url)
        self.assertEqual(dup_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(dup_response.data["title"], "New Screen 2 (Copy)")
        self.assertEqual(dup_response.data["display_order"], 3)
        dup_scr_id = dup_response.data["id"]

        # Update
        payload["title"] = "New Screen 2 Updated"
        response = self.client.put(reverse("screen-detail", args=[new_scr_id]), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "New Screen 2 Updated")

        # Patch
        response = self.client.patch(reverse("screen-detail", args=[new_scr_id]), {"title": "New Screen 2 Patched"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "New Screen 2 Patched")

        # Delete
        del_resp = self.client.delete(reverse("screen-detail", args=[new_scr_id]))
        self.assertEqual(del_resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Screen.objects.filter(id=new_scr_id).count(), 0)

        # Cleanup duplicate
        self.client.delete(reverse("screen-detail", args=[dup_scr_id]))

    def test_screen_reorder_and_integrity(self):
        """Verify atomic screens reordering within same activity, and same-parent constraint."""
        self.client.force_authenticate(user=self.content_creator)

        # Create two screens under activity1
        scr2 = Screen.objects.create(activity=self.activity1, title="Scr 2", screen_type="VIDEO", estimated_duration=60, display_order=2)

        # Reorder
        reorder_url = reverse("screen-reorder")
        payload = {"ids": [scr2.id, self.screen1.id]}
        response = self.client.patch(reorder_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        scr2.refresh_from_db()
        self.screen1.refresh_from_db()
        self.assertEqual(scr2.display_order, 1)
        self.assertEqual(self.screen1.display_order, 2)

        # Integrity check: try to reorder with a screen from another activity
        act_other = Activity.objects.create(experience=self.experience2, title="Other Act", estimated_duration=5, display_order=2)
        scr_other = Screen.objects.create(activity=act_other, title="Other Scr", screen_type="QUIZ", estimated_duration=60, display_order=1)
        payload_invalid = {"ids": [scr2.id, scr_other.id]}
        response_invalid = self.client.patch(reorder_url, payload_invalid, format="json")
        self.assertEqual(response_invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response_invalid.data)

    def test_learning_outcomes_crud(self):
        """Verify learning outcome add, edit, and delete endpoints."""
        self.client.force_authenticate(user=self.content_creator)

        # Add learning outcome to experience1
        add_url = reverse("experience-add-learning-outcome", args=[self.experience1.id])
        response = self.client.post(add_url, {"text": "Learn greetings"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["text"], "Learn greetings")
        outcome_id = response.data["id"]

        # Edit learning outcome
        edit_url = reverse("learning-outcome-detail", args=[outcome_id])
        response = self.client.patch(edit_url, {"text": "Learn greetings modified"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["text"], "Learn greetings modified")

        # Delete learning outcome
        response = self.client.delete(edit_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(LearningOutcome.objects.filter(id=outcome_id).count(), 0)

    def test_experience_tags_management(self):
        """Verify tags add and remove on a experience."""
        self.client.force_authenticate(user=self.content_creator)

        # Add tags
        add_url = reverse("experience-tags", args=[self.experience1.id])
        response = self.client.post(add_url, {"tags": ["grammar", "nouns"]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("grammar", response.data["tags"])
        self.assertIn("nouns", response.data["tags"])

        # Remove tags
        remove_url = reverse("experience-tags", args=[self.experience1.id])
        response = self.client.delete(remove_url, {"tags": ["grammar"]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("grammar", response.data["tags"])
        self.assertIn("nouns", response.data["tags"])

    def test_school_admin_cannot_write_activity_or_screen(self):
        """School Admin gets 403 Forbidden on writes for activities and screens."""
        self.client.force_authenticate(user=self.school_admin)

        # Activity Create
        response = self.client.post(reverse("activity-list"), {"experience": self.experience1.id, "title": "No"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Activity Reorder
        response = self.client.patch(reverse("activity-reorder"), {"ids": [self.activity1.id]})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Screen Create
        response = self.client.post(reverse("screen-list"), {"activity": self.activity1.id, "title": "No"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Screen Duplicate
        response = self.client.post(reverse("screen-duplicate", args=[self.screen1.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_media_upload_allowed_types(self):
        """Verify successful upload of whitelisted file types (JPG, PDF, MP3, MP4, SVG)."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.client.force_authenticate(user=self.content_creator)

        # 1. Allowed JPG Upload
        file_jpg = SimpleUploadedFile("test.jpg", b"\xff\xd8\xff\xe0\x00\x10JFIF", content_type="image/jpeg")
        response = self.client.post(reverse("media-upload"), {"file": file_jpg, "name": "Test Image"}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["media_type"], "IMAGE")
        self.assertEqual(response.data["original_filename"], "test.jpg")
        media_id = response.data["id"]

        # Clean up local file created by test
        media_obj = Media.objects.get(id=media_id)
        if media_obj.file:
            media_obj.file.delete(save=False)

        # 2. Allowed PDF Upload
        file_pdf = SimpleUploadedFile("test.pdf", b"%PDF-1.4...", content_type="application/pdf")
        response = self.client.post(reverse("media-upload"), {"file": file_pdf}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["media_type"], "DOCUMENT")
        media_id_pdf = response.data["id"]
        Media.objects.get(id=media_id_pdf).file.delete(save=False)

        # 3. Allowed SVG Upload
        file_svg = SimpleUploadedFile("test.svg", b'<svg width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>', content_type="image/svg+xml")
        response = self.client.post(reverse("media-upload"), {"file": file_svg}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["media_type"], "IMAGE")
        media_id_svg = response.data["id"]
        Media.objects.get(id=media_id_svg).file.delete(save=False)

    def test_media_upload_disallowed_types_and_xss(self):
        """Verify rejection of disallowed extensions, wrong signatures, or SVG XSS."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.client.force_authenticate(user=self.content_creator)

        # 1. Disallowed HTML Upload
        file_html = SimpleUploadedFile("malicious.html", b"<html><body>Hello</body></html>", content_type="text/html")
        response = self.client.post(reverse("media-upload"), {"file": file_html}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Allowed PNG extension but invalid magic bytes (masquerading exe/txt)
        file_fake = SimpleUploadedFile("fake.png", b"Not a png file", content_type="image/png")
        response = self.client.post(reverse("media-upload"), {"file": file_fake}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. SVG containing <script> tag
        file_svg_script = SimpleUploadedFile("xss.svg", b'<svg><script>alert("XSS")</script></svg>', content_type="image/svg+xml")
        response = self.client.post(reverse("media-upload"), {"file": file_svg_script}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 4. SVG containing onload handler
        file_svg_onload = SimpleUploadedFile("xss_onload.svg", b'<svg onload="alert(1)"></svg>', content_type="image/svg+xml")
        response = self.client.post(reverse("media-upload"), {"file": file_svg_onload}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_media_upload_oversize(self):
        """Verify file upload rejection when size limit is exceeded."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.client.force_authenticate(user=self.content_creator)

        oversize_data = b"\xff\xd8\xff" + (b"\x00" * (10 * 1024 * 1024 + 100))
        file_big = SimpleUploadedFile("too_large.jpg", oversize_data, content_type="image/jpeg")
        response = self.client.post(reverse("media-upload"), {"file": file_big}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_media_upload_filename_sanitization(self):
        """Verify directory traversal path characters are removed and UUID stored filename is generated."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.client.force_authenticate(user=self.content_creator)

        file_traversal = SimpleUploadedFile("../../../evil.png", b"\x89PNG\r\n\x1a\nSomeData", content_type="image/png")
        response = self.client.post(reverse("media-upload"), {"file": file_traversal}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        self.assertEqual(response.data["original_filename"], "evil.png")
        stored_name = response.data["stored_filename"]
        self.assertNotIn("..", stored_name)
        self.assertNotIn("/", stored_name)
        self.assertTrue(stored_name.endswith(".png"))

        Media.objects.get(id=response.data["id"]).file.delete(save=False)

    def test_media_replace_allowed_and_replaces_file(self):
        """Verify replacing media keeps same ID, validates new file, and deletes old physical file."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.client.force_authenticate(user=self.content_creator)

        # 1. Upload first file
        file1 = SimpleUploadedFile("first.jpg", b"\xff\xd8\xfffirst", content_type="image/jpeg")
        response1 = self.client.post(reverse("media-upload"), {"file": file1}, format="multipart")
        media_id = response1.data["id"]
        old_stored_path = response1.data["file"]

        from django.core.files.storage import default_storage
        self.assertTrue(default_storage.exists(old_stored_path.replace("/media/", "")))

        # 2. Replace with a PNG file
        file2 = SimpleUploadedFile("second.png", b"\x89PNG\r\n\x1a\nsecond", content_type="image/png")
        response2 = self.client.post(reverse("media-replace", args=[media_id]), {"file": file2}, format="multipart")
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        
        self.assertEqual(response2.data["id"], media_id)
        self.assertEqual(response2.data["media_type"], "IMAGE")
        self.assertEqual(response2.data["original_filename"], "second.png")

        self.assertFalse(default_storage.exists(old_stored_path.replace("/media/", "")))
        
        new_stored_path = response2.data["file"]
        self.assertTrue(default_storage.exists(new_stored_path.replace("/media/", "")))

        Media.objects.get(id=media_id).file.delete(save=False)

    def test_media_delete_with_usage_and_force(self):
        """Verify deletion is blocked with 409 Conflict if used by a screen, and requires force parameter."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.client.force_authenticate(user=self.content_creator)

        # 1. Create media
        file_jpg = SimpleUploadedFile("check.jpg", b"\xff\xd8\xffcheck", content_type="image/jpeg")
        resp_media = self.client.post(reverse("media-upload"), {"file": file_jpg}, format="multipart")
        media_id = resp_media.data["id"]
        media_url = resp_media.data["url"]
        stored_path = resp_media.data["file"].replace("/media/", "")

        # 2. Reference it inside a screen content field
        self.screen1.content = {"background_media_id": media_id, "background_url": media_url}
        self.screen1.save()

        # 3. Try to delete media without force
        response = self.client.delete(reverse("media-detail", args=[media_id]))
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("usages", response.data)
        self.assertEqual(len(response.data["usages"]), 1)
        self.assertEqual(response.data["usages"][0]["screen_id"], self.screen1.id)

        # 4. Delete with force=true
        response_force = self.client.delete(f"{reverse('media-detail', args=[media_id])}?force=true")
        self.assertEqual(response_force.status_code, status.HTTP_204_NO_CONTENT)

        self.assertEqual(Media.objects.filter(id=media_id).count(), 0)
        from django.core.files.storage import default_storage
        self.assertFalse(default_storage.exists(stored_path))

    def test_school_admin_cannot_write_media(self):
        """Verify School Admin gets 403 on upload, replace, and delete."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        self.client.force_authenticate(user=self.content_creator)
        file_jpg = SimpleUploadedFile("allow.jpg", b"\xff\xd8\xffallow", content_type="image/jpeg")
        resp_media = self.client.post(reverse("media-upload"), {"file": file_jpg}, format="multipart")
        media_id = resp_media.data["id"]

        self.client.force_authenticate(user=self.school_admin)

        # Upload
        file_test = SimpleUploadedFile("test.jpg", b"\xff\xd8\xff", content_type="image/jpeg")
        response = self.client.post(reverse("media-upload"), {"file": file_test}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Replace
        response = self.client.post(reverse("media-replace", args=[media_id]), {"file": file_test}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Delete
        response = self.client.delete(reverse("media-detail", args=[media_id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        Media.objects.get(id=media_id).file.delete(save=False)

    def test_validation_experience_no_activities(self):
        """Verify validation fails for experience with no activities."""
        self.client.force_authenticate(user=self.content_creator)
        
        # 1. Fetch latest report when never run -> 404
        url_get = reverse("validation-get-latest-report", args=[self.experience1.id])
        response = self.client.get(url_get)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # 2. Run validation -> 200 and FAILED status
        url_run = reverse("validation-run-validation", args=[self.experience1.id])
        response = self.client.post(url_run)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "FAILED")
        self.assertGreater(response.data["errors"], 0)
        self.assertEqual(response.data["passed"], 2)  # has title, has grade

        # Verify detailed report url returns same structure
        url_detail = reverse("validation-get-detailed-report", args=[self.experience1.id])
        response_detail = self.client.get(url_detail)
        self.assertEqual(response_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(response_detail.data["status"], "FAILED")

    def test_validation_experience_empty_screens_and_broken_media(self):
        """Verify validation flags empty screens and broken media reference errors."""
        self.client.force_authenticate(user=self.content_creator)

        # Clear screen1 content to trigger FAILED state
        self.screen1.content = {}
        self.screen1.save()

        # Experience 2 has 1 activity with 1 screen in setup (screen1)
        url_run = reverse("validation-run-validation", args=[self.experience2.id])
        response = self.client.post(url_run)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "FAILED")

        # Give screen1 content, but reference a broken media ID
        self.screen1.content = {"media_id": 9999}
        self.screen1.save()
        
        response = self.client.post(url_run)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        broken_media_messages = [r["message"] for r in results if r["rule"] == "screen_broken_media"]
        self.assertTrue(any("broken media" in msg.lower() for msg in broken_media_messages))

    def test_validation_experience_warnings_only_and_success(self):
        """Verify warning status and clean passed status when all rules met."""
        self.client.force_authenticate(user=self.content_creator)

        from super_admin.models import Grade
        grade = Grade.objects.first()
        scen = Experience.objects.create(
            title="Valid Experience",
            description="desc",
            grade=grade,
            subject="English",
            language="English",
            estimated_duration=30,
            status="DRAFT",
            created_by=self.content_creator
        )
        
        # Missing thumbnail and outcomes -> Should return PASSED_WITH_WARNINGS
        act = Activity.objects.create(experience=scen, title="Act 1", estimated_duration=15, display_order=1)
        scr = Screen.objects.create(activity=act, title="Scr 1", screen_type="INFORMATION", estimated_duration=30, content={"text": "hello"}, display_order=1)

        url_run = reverse("validation-run-validation", args=[scen.id])
        response = self.client.post(url_run)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "PASSED_WITH_WARNINGS")
        self.assertEqual(response.data["errors"], 0)
        self.assertGreater(response.data["warnings"], 0)

        # Now satisfy warnings: add thumbnail, outcomes, and fix duration sum
        scen.thumbnail = "thumb.png"
        scen.save()
        LearningOutcome.objects.create(experience=scen, text="outcome")
        scen.estimated_duration = 50
        scen.save()

        # Re-run validation
        response_success = self.client.post(url_run)
        self.assertEqual(response_success.status_code, status.HTTP_200_OK)
        self.assertEqual(response_success.data["status"], "PASSED")
        self.assertEqual(response_success.data["errors"], 0)
        self.assertEqual(response_success.data["warnings"], 0)

        # Check overwrite
        self.assertEqual(ValidationReport.objects.filter(experience=scen).count(), 1)

    def test_validation_permissions(self):
        """Verify School Admin is blocked with 403, and Anon is blocked with 401."""
        self.client.force_authenticate(user=self.school_admin)
        url_run = reverse("validation-run-validation", args=[self.experience1.id])
        response = self.client.post(url_run)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.logout()
        response = self.client.post(url_run)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_preview_experience_success_and_ordering(self):
        """Verify experience preview returns nested structure sorted by display_order, excluding deleted items."""
        self.client.force_authenticate(user=self.content_creator)

        from super_admin.models import Grade
        grade = Grade.objects.first()
        scen = Experience.objects.create(
            title="Preview Experience",
            description="desc",
            grade=grade,
            subject="English",
            language="English",
            estimated_duration=30,
            status="DRAFT",
            created_by=self.content_creator
        )
        
        act2 = Activity.objects.create(experience=scen, title="Activity Order 2", estimated_duration=10, display_order=2)
        act1 = Activity.objects.create(experience=scen, title="Activity Order 1", estimated_duration=10, display_order=1)
        act_del = Activity.objects.create(experience=scen, title="Deleted Activity", estimated_duration=10, display_order=3)
        act_del.delete()

        scr2 = Screen.objects.create(activity=act1, title="Screen Order 2", screen_type="INFORMATION", display_order=2, estimated_duration=30)
        scr1 = Screen.objects.create(activity=act1, title="Screen Order 1", screen_type="INFORMATION", display_order=1, estimated_duration=30)
        scr_del = Screen.objects.create(activity=act1, title="Deleted Screen", screen_type="INFORMATION", display_order=3, estimated_duration=30)
        scr_del.delete()

        url_preview = reverse("experience-preview", args=[scen.id])
        response = self.client.get(url_preview)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        activities_data = response.data["activities"]
        self.assertEqual(len(activities_data), 2)
        self.assertEqual(activities_data[0]["id"], act1.id)
        self.assertEqual(activities_data[1]["id"], act2.id)

        screens_data = activities_data[0]["screens"]
        self.assertEqual(len(screens_data), 2)
        self.assertEqual(screens_data[0]["id"], scr1.id)
        self.assertEqual(screens_data[1]["id"], scr2.id)

    def test_preview_broken_media_handling(self):
        """Verify preview resolves valid media, reports broken media, and does not 500."""
        self.client.force_authenticate(user=self.content_creator)

        from super_admin.models import Grade
        grade = Grade.objects.first()
        scen = Experience.objects.create(
            title="Preview Media Experience",
            grade=grade,
            subject="English",
            language="English",
            estimated_duration=30,
            status="DRAFT",
            created_by=self.content_creator
        )
        act = Activity.objects.create(experience=scen, title="Act", estimated_duration=10, display_order=1)
        
        media_valid = Media.objects.create(
            name="valid_scene.jpg",
            media_type="IMAGE",
            file_size=2048,
            folder="Images",
            url="http://localhost:8000/media/images/valid_scene.jpg",
            uploaded_by=self.content_creator
        )
        
        scr = Screen.objects.create(
            activity=act,
            title="Screen",
            screen_type="INFORMATION",
            display_order=1,
            estimated_duration=30,
            content={"image_id": media_valid.id, "bg_media_id": 99999}
        )

        url_preview = reverse("experience-preview", args=[scen.id])
        response = self.client.get(url_preview)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        screen_payload = response.data["activities"][0]["screens"][0]
        resolved_media = screen_payload["resolved_media"]
        self.assertEqual(len(resolved_media), 2)
        
        valid_ref = next(m for m in resolved_media if m["media_id"] == media_valid.id)
        self.assertEqual(valid_ref["missing"], False)
        self.assertIn("valid_scene.jpg", valid_ref["url"])
        
        missing_ref = next(m for m in resolved_media if m["media_id"] == 99999)
        self.assertEqual(missing_ref["missing"], True)
        
        missing_assets = response.data["debug"]["missing_assets"]
        self.assertEqual(len(missing_assets), 1)
        self.assertEqual(missing_assets[0]["reference"], "99999")

    def test_preview_session_endpoints(self):
        """Verify stateless preview start, restart, and stop endpoints."""
        self.client.force_authenticate(user=self.content_creator)

        # Start Session
        url_start = reverse("preview-start")
        response = self.client.post(url_start, {"experience_id": self.experience1.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("session_id", response.data)
        self.assertIn("payload", response.data)
        session_id = response.data["session_id"]

        # Restart Session
        url_restart = reverse("preview-restart")
        response = self.client.post(url_restart, {"experience_id": self.experience1.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("session_id", response.data)
        self.assertNotEqual(response.data["session_id"], session_id)

        # Stop Session
        url_stop = reverse("preview-stop")
        response = self.client.post(url_stop, {"session_id": session_id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "stopped")

    def test_preview_permissions(self):
        """Verify School Admin is blocked with 403, and Anon is blocked with 401."""
        self.client.force_authenticate(user=self.school_admin)
        url_preview = reverse("experience-preview", args=[self.experience1.id])
        response = self.client.get(url_preview)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.logout()
        response = self.client.get(url_preview)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# Phase 7 Tests — Publish Pipeline
# ---------------------------------------------------------------------------
class PublishPipelineTests(APITestCase):
    """Unit tests for the .elab packaging and publish pipeline (Phase 7)."""

    def setUp(self):
        import os, tempfile
        from django.conf import settings as dj_settings

        # Use a temp dir for packages so tests don't write to real PACKAGES_ROOT
        self._tmp_pkg_root = tempfile.mkdtemp(prefix="test_pkg_")
        self._orig_pkg_root = getattr(dj_settings, "PACKAGES_ROOT", None)
        dj_settings.PACKAGES_ROOT = self._tmp_pkg_root

        # Users
        self.content_creator = User.objects.create_user(
            username="ph7_cc", email="ph7_cc@example.com", password="pass", role="CONTENT_CREATOR"
        )
        self.super_admin = User.objects.create_user(
            username="ph7_sa", email="ph7_sa@example.com", password="pass", role="SUPER_ADMIN"
        )
        self.school_admin = User.objects.create_user(
            username="ph7_school", email="ph7_school@example.com", password="pass", role="SCHOOL_ADMIN"
        )

        self.grade = Grade.objects.create(grade_name="Grade PH7", sort_order=99)

        # Build a fully-valid experience (title + grade + 1 activity + 1 screen w/ content)
        self.valid_experience = Experience.objects.create(
            title="Phase7 Publish Test",
            description="Test",
            grade=self.grade,
            subject="English",
            language="English",
            difficulty="BEGINNER",
            estimated_duration=30,
            status="DRAFT",
            created_by=self.content_creator,
        )
        self.act = Activity.objects.create(
            experience=self.valid_experience,
            title="Activity One",
            learning_objective="Learn",
            estimated_duration=15,
            mastery_threshold=80,
            display_order=1,
        )
        self.scr = Screen.objects.create(
            activity=self.act,
            title="Screen One",
            screen_type="INFORMATION",
            display_order=1,
            estimated_duration=30,
            content={"elements": [{"id": "1", "type": "text", "props": {"value": "Hello world"}}]},
        )

        # An invalid experience (no activities) for 422 tests
        self.invalid_experience = Experience.objects.create(
            title="No Activities Experience",
            description="Empty",
            grade=self.grade,
            subject="English",
            language="English",
            difficulty="BEGINNER",
            estimated_duration=10,
            status="DRAFT",
            created_by=self.content_creator,
        )

    def tearDown(self):
        import shutil
        from django.conf import settings as dj_settings
        shutil.rmtree(self._tmp_pkg_root, ignore_errors=True)
        if self._orig_pkg_root is not None:
            dj_settings.PACKAGES_ROOT = self._orig_pkg_root

    # ------------------------------------------------------------------
    def test_publish_invalid_experience_returns_422(self):
        """Publishing a experience with no activities → 422 + validation report."""
        self.client.force_authenticate(user=self.content_creator)
        url = reverse("publish-experience", kwargs={"experience_id": self.invalid_experience.id})
        response = self.client.post(url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("validation_report", response.data)
        self.assertEqual(response.data["validation_report"]["status"], "FAILED")

        # No DB row created
        from .models import PublishVersion
        self.assertEqual(
            PublishVersion.objects.filter(
                published_package__experience=self.invalid_experience
            ).count(),
            0,
        )

        # No .elab on disk
        import os
        elab_files = [
            f for f in os.listdir(self._tmp_pkg_root)
            if f.endswith(".elab")
        ]
        self.assertEqual(len(elab_files), 0)

    def test_publish_valid_experience_creates_elab_on_disk(self):
        """Publishing a valid experience → submits → Super Admin approves → 201, .elab on disk."""
        import hashlib, os
        from .models import PublishVersion

        self.client.force_authenticate(user=self.content_creator)
        url = reverse("publish-experience", kwargs={"experience_id": self.valid_experience.id})
        response = self.client.post(url, {"version": "1.0", "release_notes": "First release"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Super Admin approves
        self.client.force_authenticate(user=self.super_admin)
        approve_url = reverse("super-admin-experiences-approve", args=[self.valid_experience.id])
        response = self.client.post(approve_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertIn("version", response.data)
        self.assertIn("checksum", response.data)
        self.assertIn("download_url", response.data)
        self.assertEqual(response.data["version"], "1.0")

        # Verify .elab file exists on disk
        version_obj = PublishVersion.objects.get(id=response.data["version_id"])
        self.assertIsNotNone(version_obj.file_path)
        self.assertTrue(os.path.exists(version_obj.file_path), "elab file missing on disk")

        # Verify checksum in DB matches actual file
        h = hashlib.sha256()
        with open(version_obj.file_path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
        self.assertEqual(h.hexdigest(), version_obj.checksum)

        # Verify experience status flipped to APPROVED
        self.valid_experience.refresh_from_db()
        self.assertEqual(self.valid_experience.status, "APPROVED")

    def test_version_auto_increment_and_duplicate_409(self):
        """Two publishes → 1.0 then 1.1.  Supplying duplicate version → 409."""
        self.client.force_authenticate(user=self.content_creator)
        url = reverse("publish-experience", kwargs={"experience_id": self.valid_experience.id})

        # Submit first version
        r1 = self.client.post(url, {"version": "1.0"}, format="json")
        self.assertEqual(r1.status_code, status.HTTP_200_OK)

        # Approve first version
        self.client.force_authenticate(user=self.super_admin)
        approve_url = reverse("super-admin-experiences-approve", args=[self.valid_experience.id])
        r1_app = self.client.post(approve_url)
        self.assertEqual(r1_app.status_code, status.HTTP_200_OK)
        self.assertEqual(r1_app.data["version"], "1.0")

        # Submit second version
        self.client.force_authenticate(user=self.content_creator)
        r2 = self.client.post(url, {"version": "1.1"}, format="json")
        self.assertEqual(r2.status_code, status.HTTP_200_OK)

        # Approve second version
        self.client.force_authenticate(user=self.super_admin)
        r2_app = self.client.post(approve_url)
        self.assertEqual(r2_app.status_code, status.HTTP_200_OK)
        self.assertEqual(r2_app.data["version"], "1.1")

        # Duplicate version → 409
        self.client.force_authenticate(user=self.content_creator)
        r3 = self.client.post(url, {"version": "1.0"}, format="json")
        self.assertEqual(r3.status_code, status.HTTP_409_CONFLICT)

    def test_download_returns_file_with_correct_headers(self):
        """Download endpoint streams the .elab with Content-Disposition and 200."""
        # First publish
        self.client.force_authenticate(user=self.content_creator)
        pub_url = reverse("publish-experience", kwargs={"experience_id": self.valid_experience.id})
        pub_response = self.client.post(pub_url, {}, format="json")
        self.assertEqual(pub_response.status_code, status.HTTP_200_OK)

        # Approve
        self.client.force_authenticate(user=self.super_admin)
        approve_url = reverse("super-admin-experiences-approve", args=[self.valid_experience.id])
        pub_response = self.client.post(approve_url)
        self.assertEqual(pub_response.status_code, status.HTTP_200_OK)
        version_id = pub_response.data["version_id"]

        # Switch auth back to content creator
        self.client.force_authenticate(user=self.content_creator)
        # Download
        dl_url = reverse("package-download", kwargs={"pk": version_id})
        response = self.client.get(dl_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("attachment", response.get("Content-Disposition", ""))
        self.assertIn(".zip", response.get("Content-Disposition", ""))

        # School Admin gets 403
        self.client.force_authenticate(user=self.school_admin)
        response_school = self.client.get(dl_url)
        self.assertEqual(response_school.status_code, status.HTTP_403_FORBIDDEN)

    def test_regenerate_keeps_version_bumps_build(self):
        """Regenerate keeps the version string, bumps build number, refreshes checksum."""
        import hashlib, os
        from .models import PublishVersion

        self.client.force_authenticate(user=self.content_creator)
        pub_url = reverse("publish-experience", kwargs={"experience_id": self.valid_experience.id})
        pub_r = self.client.post(pub_url, {}, format="json")
        self.assertEqual(pub_r.status_code, status.HTTP_200_OK)

        # Approve
        self.client.force_authenticate(user=self.super_admin)
        approve_url = reverse("super-admin-experiences-approve", args=[self.valid_experience.id])
        pub_r = self.client.post(approve_url)
        self.assertEqual(pub_r.status_code, status.HTTP_200_OK)

        version_id = pub_r.data["version_id"]
        original_version = pub_r.data["version"]     # "1.0"
        original_build = pub_r.data["build_number"]  # 1
        original_checksum = pub_r.data["checksum"]

        # Switch auth back to content creator
        self.client.force_authenticate(user=self.content_creator)
        regen_url = reverse("package-regenerate", kwargs={"pk": version_id})
        regen_r = self.client.post(regen_url, {}, format="json")
        self.assertEqual(regen_r.status_code, status.HTTP_200_OK)
        self.assertEqual(regen_r.data["version"], original_version)
        self.assertGreater(regen_r.data["build_number"], original_build)

        # New checksum is a valid SHA-256 (64 hex chars)
        new_checksum = regen_r.data["checksum"]
        self.assertEqual(len(new_checksum), 64)

    def test_publish_package_internal_layout_and_metadata(self):
        """
        Verifies that .elab archives physically bundle experience.json, metadata.json, and manifest.json
        at the root, and validates the 8 structural schema keys inside metadata.json.
        """
        import json as _json, zipfile
        from .models import PublishVersion

        self.client.force_authenticate(user=self.content_creator)
        url = reverse("publish-experience", kwargs={"experience_id": self.valid_experience.id})
        response = self.client.post(url, {"version": "1.0", "release_notes": "Layout test"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Approve
        self.client.force_authenticate(user=self.super_admin)
        approve_url = reverse("super-admin-experiences-approve", args=[self.valid_experience.id])
        response = self.client.post(approve_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        version_obj = PublishVersion.objects.get(id=response.data["version_id"])

        with zipfile.ZipFile(version_obj.file_path, "r") as zf:
            namelist = zf.namelist()
            self.assertIn("experience.json", namelist, "experience.json missing from zip root")
            self.assertIn("metadata.json", namelist, "metadata.json missing from zip root")
            self.assertIn("manifest.json", namelist, "manifest.json missing from zip root")

            # Validate metadata.json structural schema layout
            meta_bytes = zf.read("metadata.json")
            meta_data = _json.loads(meta_bytes.decode("utf-8"))
            required_keys = ["title", "grade", "subject", "language", "difficulty", "duration", "thumbnail", "version"]
            for k in required_keys:
                self.assertIn(k, meta_data, f"Key '{k}' missing from metadata.json")

            self.assertEqual(meta_data["title"], self.valid_experience.title)
            self.assertEqual(meta_data["version"], "1.0")

            # Validate manifest.json checksums dictionary
            manifest_bytes = zf.read("manifest.json")
            manifest_data = _json.loads(manifest_bytes.decode("utf-8"))
            self.assertIn("checksums", manifest_data)
            self.assertIn("experience_json", manifest_data["checksums"])
            self.assertIn("metadata_json", manifest_data["checksums"])

    def test_publish_package_assets_directory_structure(self):
        """
        Verifies that physical media assets are collected under assets/ subfolders (e.g. assets/images/)
        instead of historical media/ paths.
        """
        import zipfile
        from django.core.files.uploadedfile import SimpleUploadedFile
        from .models import Media, PublishVersion

        # Create a test Media asset
        dummy_file = SimpleUploadedFile("sample_img.jpg", b"fake_image_data", content_type="image/jpeg")
        media = Media.objects.create(
            file=dummy_file,
            media_type="IMAGE",
            name="Sample Image",
            uploaded_by=self.content_creator,
        )

        # Attach media reference to screen content
        self.scr.content = {"elements": [{"id": "1", "type": "image", "props": {"image_id": media.id}}]}
        self.scr.save()

        self.client.force_authenticate(user=self.content_creator)
        url = reverse("publish-experience", kwargs={"experience_id": self.valid_experience.id})
        response = self.client.post(url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Approve
        self.client.force_authenticate(user=self.super_admin)
        approve_url = reverse("super-admin-experiences-approve", args=[self.valid_experience.id])
        response = self.client.post(approve_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        version_obj = PublishVersion.objects.get(id=response.data["version_id"])

        with zipfile.ZipFile(version_obj.file_path, "r") as zf:
            namelist = zf.namelist()
            asset_paths = [n for n in namelist if n.startswith("assets/")]
            self.assertGreater(len(asset_paths), 0, "No assets found under assets/ tree branch")
            self.assertTrue(any("assets/images/" in p for p in asset_paths), "assets/images/ subfolder missing")


