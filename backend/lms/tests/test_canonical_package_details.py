from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from super_admin.models import Grade
from content_studio.models import Experience, PublishedPackage, PublishVersion, Activity, Screen

User = get_user_model()


class CanonicalPackageDetailAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create author user
        self.author = User.objects.create_user(
            username="content_creator_detail",
            password="Password123!",
            role=User.Role.CONTENT_CREATOR
        )

        # Create grade
        self.grade = Grade.objects.create(
            grade_name="Grade 6",
            sort_order=6
        )

        # Create approved experience
        self.exp_approved = Experience.objects.create(
            title="Grammar Basics",
            description="Introduction to Nouns and Verbs",
            grade=self.grade,
            subject="English",
            language="English",
            difficulty="BEGINNER",
            estimated_duration=45,
            status=Experience.Status.APPROVED,
            created_by=self.author,
            is_deleted=False
        )

        # Create activity
        self.act1 = Activity.objects.create(
            experience=self.exp_approved,
            title="Nouns Overview",
            description="Learn common nouns",
            activity_type="GRAMMAR",
            estimated_duration=15,
            display_order=1
        )

        # Create screen
        self.scr1 = Screen.objects.create(
            activity=self.act1,
            title="What is a Noun?",
            screen_type="INFORMATION",
            display_order=1,
            estimated_duration=300,
            content={"heading": "Nouns", "body": "A noun is a person, place, or thing."}
        )

        # Create published package
        self.pkg_approved = PublishedPackage.objects.create(
            experience=self.exp_approved,
            package_name="Grammar Basics Package",
            output_format=".elab",
            compression_status="COMPLETED"
        )

        # Create publish version
        self.version_approved = PublishVersion.objects.create(
            published_package=self.pkg_approved,
            version_number="1.2.0",
            build_number=2,
            package_size=2048,
            checksum="fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
            published_by=self.author
        )

        # Create draft experience
        self.exp_draft = Experience.objects.create(
            title="Draft Adjectives",
            grade=self.grade,
            subject="English",
            language="English",
            estimated_duration=20,
            status=Experience.Status.DRAFT,
            created_by=self.author,
            is_deleted=False
        )
        self.pkg_draft = PublishedPackage.objects.create(
            experience=self.exp_draft,
            package_name="Draft Adjectives Package",
            compression_status="PENDING"
        )

        # Create soft-deleted experience
        self.exp_deleted = Experience.objects.create(
            title="Deleted Experience",
            grade=self.grade,
            subject="English",
            language="English",
            estimated_duration=10,
            status=Experience.Status.APPROVED,
            created_by=self.author,
            is_deleted=True
        )
        self.pkg_deleted = PublishedPackage.objects.create(
            experience=self.exp_deleted,
            package_name="Deleted Package",
            compression_status="COMPLETED"
        )

    def test_successful_package_details(self):
        """Test GET /api/packages/{package_id}/ returns 200 with complete hierarchy and metadata."""
        url = f"/api/packages/{self.pkg_approved.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertEqual(data["packageId"], str(self.pkg_approved.id))
        self.assertEqual(data["name"], "Grammar Basics")
        self.assertEqual(data["version"], "1.2.0")
        self.assertEqual(data["buildNumber"], 2)
        self.assertEqual(data["packageSize"], 2048)
        self.assertEqual(data["checksum"], "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210")
        self.assertTrue(data["published"])
        self.assertTrue(data["downloadUrl"].endswith(f"/api/packages/{self.pkg_approved.id}/download/"))

        # Verify experience and activities hierarchy
        self.assertIn("experience", data)
        self.assertEqual(data["experience"]["title"], "Grammar Basics")
        self.assertIn("activities", data)
        self.assertEqual(len(data["activities"]), 1)
        self.assertEqual(data["activities"][0]["title"], "Nouns Overview")
        self.assertEqual(len(data["activities"][0]["screens"]), 1)
        self.assertEqual(data["activities"][0]["screens"][0]["title"], "What is a Noun?")

    def test_query_by_experience_id(self):
        """Test package can also be resolved by experience ID."""
        url = f"/api/packages/{self.exp_approved.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["packageId"], str(self.pkg_approved.id))

    def test_unpublished_package_returns_404(self):
        """Test draft/uncompressed package returns 404."""
        url = f"/api/packages/{self.pkg_draft.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_soft_deleted_package_returns_404(self):
        """Test soft-deleted package returns 404."""
        url = f"/api/packages/{self.pkg_deleted.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_nonexistent_package_returns_404(self):
        """Test non-existent ID returns 404."""
        response = self.client.get("/api/packages/999999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_and_legacy_endpoints_unaffected(self):
        """Test /api/packages/, /api/lms/packages/, and /api/v1/content/packages/<pk>/ work."""
        # /api/packages/
        res_list = self.client.get("/api/packages/")
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)

        # /api/lms/packages/
        res_lms = self.client.get("/api/lms/packages/")
        self.assertEqual(res_lms.status_code, status.HTTP_200_OK)

        # Authenticate staff for CMS endpoint
        self.client.force_authenticate(user=self.author)
        res_cms = self.client.get(f"/api/v1/content/packages/{self.version_approved.id}/")
        self.assertEqual(res_cms.status_code, status.HTTP_200_OK)
