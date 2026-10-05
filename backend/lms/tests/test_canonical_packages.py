import os
import tempfile
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from super_admin.models import Grade
from content_studio.models import Experience, PublishedPackage, PublishVersion

User = get_user_model()


class CanonicalPackageListAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create author user
        self.author = User.objects.create_user(
            username="content_creator_1",
            password="Password123!",
            role=User.Role.CONTENT_CREATOR
        )

        # Create grade
        self.grade = Grade.objects.create(
            grade_name="Grade 5",
            sort_order=5
        )

        # Create approved experience
        self.exp_approved = Experience.objects.create(
            title="English Level 1",
            description="Foundational English lesson",
            grade=self.grade,
            subject="English",
            language="English",
            difficulty="BEGINNER",
            estimated_duration=30,
            status=Experience.Status.APPROVED,
            created_by=self.author,
            is_deleted=False
        )

        # Create published package
        self.pkg_approved = PublishedPackage.objects.create(
            experience=self.exp_approved,
            package_name="English Level 1 Package",
            output_format=".elab",
            compression_status="COMPLETED"
        )

        # Create publish version
        self.version_approved = PublishVersion.objects.create(
            published_package=self.pkg_approved,
            version_number="1.0.0",
            build_number=1,
            package_size=1024,
            checksum="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            published_by=self.author
        )

        # Create draft/unpublished experience
        self.exp_draft = Experience.objects.create(
            title="Draft English Lesson",
            grade=self.grade,
            subject="English",
            language="English",
            difficulty="BEGINNER",
            estimated_duration=20,
            status=Experience.Status.DRAFT,
            created_by=self.author,
            is_deleted=False
        )
        self.pkg_draft = PublishedPackage.objects.create(
            experience=self.exp_draft,
            package_name="Draft Package",
            output_format=".elab",
            compression_status="PENDING"
        )

    def test_successful_package_list(self):
        """Test GET /api/packages/ returns published packages with all required fields."""
        response = self.client.get("/api/packages/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)

        pkg = response.data[0]
        self.assertEqual(pkg["packageId"], str(self.pkg_approved.id))
        self.assertEqual(pkg["name"], "English Level 1")
        self.assertEqual(pkg["version"], "1.0.0")
        self.assertTrue(pkg["published"])
        self.assertEqual(pkg["checksum"], "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
        self.assertTrue(pkg["downloadUrl"].endswith(f"/api/packages/{self.pkg_approved.id}/download/"))
        self.assertTrue(pkg["downloadUrl"].startswith("http://testserver"))

    def test_no_published_packages(self):
        """Test GET /api/packages/ returns empty list when no approved packages exist."""
        # Mark approved experience as draft
        self.exp_approved.status = Experience.Status.DRAFT
        self.exp_approved.save()

        response = self.client.get("/api/packages/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_unpublished_package_exclusion(self):
        """Test draft, pending, and deleted experiences are excluded."""
        # Create deleted experience
        exp_deleted = Experience.objects.create(
            title="Deleted Lesson",
            grade=self.grade,
            subject="English",
            language="English",
            estimated_duration=15,
            status=Experience.Status.APPROVED,
            created_by=self.author,
            is_deleted=True
        )
        PublishedPackage.objects.create(
            experience=exp_deleted,
            package_name="Deleted Package",
            compression_status="COMPLETED"
        )

        response = self.client.get("/api/packages/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [p["packageId"] for p in response.data]
        self.assertIn(str(self.pkg_approved.id), ids)
        self.assertNotIn(str(self.pkg_draft.id), ids)

    def test_legacy_endpoint_remains_intact(self):
        """Verify GET /api/lms/packages/ is not broken."""
        response = self.client.get("/api/lms/packages/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
