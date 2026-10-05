import os
import tempfile
import shutil
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from super_admin.models import Grade
from content_studio.models import Experience, PublishedPackage, PublishVersion

User = get_user_model()


class CanonicalPackageDownloadAPITestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create temporary directory and file for package archive simulation
        cls.temp_dir = tempfile.mkdtemp()
        cls.package_file_path = os.path.join(cls.temp_dir, "test_experience_pkg.elab")
        with open(cls.package_file_path, "wb") as f:
            f.write(b"ELAB_BINARY_PACKAGE_PAYLOAD_TEST_DATA_12345")

        # Create author user
        cls.author = User.objects.create_user(
            username="content_creator_download",
            password="Password123!",
            role=User.Role.CONTENT_CREATOR
        )

        # Create grade
        cls.grade = Grade.objects.create(
            grade_name="Grade 7",
            sort_order=7
        )

        # Create approved experience
        cls.exp_approved = Experience.objects.create(
            title="Science Lab 1",
            description="Physics intro",
            grade=cls.grade,
            subject="Science",
            language="English",
            difficulty="INTERMEDIATE",
            estimated_duration=40,
            status=Experience.Status.APPROVED,
            created_by=cls.author,
            is_deleted=False
        )

        # Create published package
        cls.pkg_approved = PublishedPackage.objects.create(
            experience=cls.exp_approved,
            package_name="Science Lab 1 Package",
            output_format=".elab",
            compression_status="COMPLETED"
        )

        # Create publish version with real disk file
        cls.version_approved = PublishVersion.objects.create(
            published_package=cls.pkg_approved,
            version_number="2.1.0",
            build_number=4,
            package_size=len(b"ELAB_BINARY_PACKAGE_PAYLOAD_TEST_DATA_12345"),
            file_path=cls.package_file_path,
            checksum="abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            published_by=cls.author
        )

        # Create draft/unapproved experience
        cls.exp_draft = Experience.objects.create(
            title="Draft Chemistry",
            grade=cls.grade,
            subject="Chemistry",
            language="English",
            estimated_duration=20,
            status=Experience.Status.DRAFT,
            created_by=cls.author,
            is_deleted=False
        )
        cls.pkg_draft = PublishedPackage.objects.create(
            experience=cls.exp_draft,
            package_name="Draft Chem Package",
            output_format=".elab",
            compression_status="PENDING"
        )
        cls.version_draft = PublishVersion.objects.create(
            published_package=cls.pkg_draft,
            version_number="0.1.0",
            build_number=1,
            package_size=10,
            file_path=cls.package_file_path,
            published_by=cls.author
        )

        # Create soft-deleted experience
        cls.exp_deleted = Experience.objects.create(
            title="Deleted Lab",
            grade=cls.grade,
            subject="Science",
            language="English",
            estimated_duration=10,
            status=Experience.Status.APPROVED,
            created_by=cls.author,
            is_deleted=True
        )
        cls.pkg_deleted = PublishedPackage.objects.create(
            experience=cls.exp_deleted,
            package_name="Deleted Package",
            compression_status="COMPLETED"
        )
        cls.version_deleted = PublishVersion.objects.create(
            published_package=cls.pkg_deleted,
            version_number="1.0.0",
            build_number=1,
            package_size=10,
            file_path=cls.package_file_path,
            published_by=cls.author
        )

        # Create package with missing disk file
        cls.exp_missing_file = Experience.objects.create(
            title="Missing File Lab",
            grade=cls.grade,
            subject="Science",
            language="English",
            estimated_duration=10,
            status=Experience.Status.APPROVED,
            created_by=cls.author,
            is_deleted=False
        )
        cls.pkg_missing_file = PublishedPackage.objects.create(
            experience=cls.exp_missing_file,
            package_name="Missing File Package",
            compression_status="COMPLETED"
        )
        cls.version_missing_file = PublishVersion.objects.create(
            published_package=cls.pkg_missing_file,
            version_number="1.0.0",
            build_number=1,
            package_size=10,
            file_path=os.path.join(cls.temp_dir, "non_existent_file.elab"),
            published_by=cls.author
        )

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        if os.path.exists(cls.temp_dir):
            shutil.rmtree(cls.temp_dir, ignore_errors=True)

    def setUp(self):
        self.client = APIClient()

    def test_published_package_download_success(self):
        """Test GET /api/packages/{package_id}/download/ streams package file with headers."""
        url = f"/api/packages/{self.pkg_approved.id}/download/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify streaming content
        content = b"".join(response.streaming_content)
        self.assertEqual(content, b"ELAB_BINARY_PACKAGE_PAYLOAD_TEST_DATA_12345")

        # Verify attachment headers
        self.assertIn("Content-Disposition", response.headers)
        self.assertIn("test_experience_pkg.elab", response.headers["Content-Disposition"])
        self.assertEqual(response.headers["X-Package-Checksum"], "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890")
        self.assertEqual(response.headers["X-Package-Version"], "2.1.0")

    def test_download_by_experience_id(self):
        """Test download resolution when queried by experience ID."""
        url = f"/api/packages/{self.exp_approved.id}/download/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = b"".join(response.streaming_content)
        self.assertEqual(content, b"ELAB_BINARY_PACKAGE_PAYLOAD_TEST_DATA_12345")

    def test_unpublished_package_download_returns_404(self):
        """Test draft/unapproved package returns 404."""
        url = f"/api/packages/{self.pkg_draft.id}/download/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_soft_deleted_package_download_returns_404(self):
        """Test soft-deleted package returns 404."""
        url = f"/api/packages/{self.pkg_deleted.id}/download/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_nonexistent_package_download_returns_404(self):
        """Test non-existent package ID returns 404."""
        response = self.client.get("/api/packages/999999/download/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_missing_file_on_disk_returns_404(self):
        """Test package with missing disk file returns 404."""
        url = f"/api/packages/{self.pkg_missing_file.id}/download/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_path_traversal_security(self):
        """Test path traversal strings in package_id cannot access server files."""
        response = self.client.get("/api/packages/..%2F..%2Fetc%2Fpasswd/download/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_legacy_and_sibling_endpoints_remain_functional(self):
        """Test /api/lms/packages/<pk>/download/, /api/packages/, and /api/packages/{id}/."""
        # Legacy LMS package download
        url_legacy = f"/api/lms/packages/{self.version_approved.id}/download/"
        res_legacy = self.client.get(url_legacy)
        self.assertEqual(res_legacy.status_code, status.HTTP_200_OK)

        # Canonical package list
        res_list = self.client.get("/api/packages/")
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)

        # Canonical package detail
        res_detail = self.client.get(f"/api/packages/{self.pkg_approved.id}/")
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
