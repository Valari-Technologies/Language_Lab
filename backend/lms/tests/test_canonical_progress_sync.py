from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from super_admin.models import School, Grade
from teacher.models import Student
from content_studio.models import Experience, PublishedPackage, PublishVersion
from lms.models import SyncLog, StudentProgress
from assessments.models import StudentAttempt

User = get_user_model()


class CanonicalProgressSyncAPITestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create School
        cls.school = School.objects.create(
            school_name="Central Academy",
            address="123 Main St",
            phone="1234567890",
            email="central@academy.edu"
        )

        # Create Grade
        cls.grade = Grade.objects.create(
            grade_name="Grade 8",
            sort_order=8
        )

        # Create Student 1 (authenticated)
        cls.user1 = User.objects.create_user(
            username="student_sync_1",
            password="Password123!",
            role=User.Role.STUDENT,
            full_name="Alice Student"
        )
        cls.student1 = Student.objects.create(
            user=cls.user1,
            school=cls.school,
            roll_no="STU-001",
            grade="Grade 8"
        )

        # Create Student 2 (another student)
        cls.user2 = User.objects.create_user(
            username="student_sync_2",
            password="Password123!",
            role=User.Role.STUDENT,
            full_name="Bob Student"
        )
        cls.student2 = Student.objects.create(
            user=cls.user2,
            school=cls.school,
            roll_no="STU-002",
            grade="Grade 8"
        )

        # Create Content Creator
        cls.author = User.objects.create_user(
            username="creator_sync",
            password="Password123!",
            role=User.Role.CONTENT_CREATOR
        )

        # Create Approved Experience & Package
        cls.exp_approved = Experience.objects.create(
            title="Grammar Unit 1",
            grade=cls.grade,
            subject="English",
            language="English",
            difficulty="BEGINNER",
            estimated_duration=30,
            status=Experience.Status.APPROVED,
            created_by=cls.author,
            is_deleted=False
        )
        cls.pkg_approved = PublishedPackage.objects.create(
            experience=cls.exp_approved,
            package_name="Grammar Unit 1 Package",
            output_format=".elab",
            compression_status="COMPLETED"
        )

    def setUp(self):
        self.client = APIClient()

    def test_unauthenticated_request_rejected(self):
        """Test unauthenticated POST /api/progress/sync/ returns 401."""
        response = self.client.post("/api/progress/sync/", {"progressId": "p1", "packageId": str(self.pkg_approved.id)}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_successful_progress_sync(self):
        """Test authenticated student can sync valid progress record."""
        self.client.force_authenticate(user=self.user1)
        payload = {
            "progressId": "prog-sync-1001",
            "studentId": "STU-001",
            "packageId": str(self.pkg_approved.id),
            "score": 90,
            "maxScore": 100,
            "stars": 4,
            "status": "COMPLETED",
            "timeSpentSeconds": 180,
            "completedAt": "2026-10-03T10:30:00Z"
        }
        response = self.client.post("/api/progress/sync/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(len(response.data["synced"]), 1)
        self.assertEqual(response.data["synced"][0]["progressId"], "prog-sync-1001")
        self.assertEqual(len(response.data["failed"]), 0)

        # Verify DB records
        self.assertTrue(SyncLog.objects.filter(idempotency_key="prog-sync-1001").exists())
        self.assertTrue(StudentProgress.objects.filter(student=self.student1, scenario_id=str(self.exp_approved.id), completed=True).exists())
        attempt = StudentAttempt.objects.get(lms_attempt_id="prog-sync-1001")
        self.assertEqual(attempt.student, self.user1)
        self.assertEqual(attempt.total_score, 90)
        self.assertEqual(attempt.percentage, 90)

    def test_cross_student_ownership_rejected(self):
        """Test student cannot submit progress under another student's identifier."""
        self.client.force_authenticate(user=self.user1)
        payload = {
            "progressId": "prog-spoof-001",
            "studentId": "STU-002",  # Belongs to Bob, authenticated user is Alice
            "packageId": str(self.pkg_approved.id),
            "score": 100,
            "status": "COMPLETED"
        }
        response = self.client.post("/api/progress/sync/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["synced"]), 0)
        self.assertEqual(len(response.data["failed"]), 1)
        self.assertIn("Unauthorized", response.data["failed"][0]["error"])

        # Verify no attempt created
        self.assertFalse(StudentAttempt.objects.filter(lms_attempt_id="prog-spoof-001").exists())

    def test_invalid_package_rejected(self):
        """Test progress for non-existent package is rejected."""
        self.client.force_authenticate(user=self.user1)
        payload = {
            "progressId": "prog-badpkg-001",
            "packageId": "999999",
            "score": 80,
            "status": "COMPLETED"
        }
        response = self.client.post("/api/progress/sync/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["failed"]), 1)
        self.assertIn("not found", response.data["failed"][0]["error"])

    def test_score_and_stars_validation(self):
        """Test invalid score or stars are rejected."""
        self.client.force_authenticate(user=self.user1)

        # Negative score
        res_bad_score = self.client.post("/api/progress/sync/", {
            "progressId": "bad-score-1",
            "packageId": str(self.pkg_approved.id),
            "score": -10,
            "maxScore": 100
        }, format="json")
        self.assertEqual(len(res_bad_score.data["failed"]), 1)

        # Stars > 5
        res_bad_stars = self.client.post("/api/progress/sync/", {
            "progressId": "bad-stars-1",
            "packageId": str(self.pkg_approved.id),
            "score": 80,
            "stars": 6
        }, format="json")
        self.assertEqual(len(res_bad_stars.data["failed"]), 1)

    def test_status_validation(self):
        """Test invalid status string is rejected."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.post("/api/progress/sync/", {
            "progressId": "bad-status-1",
            "packageId": str(self.pkg_approved.id),
            "status": "NOT_A_REAL_STATUS"
        }, format="json")
        self.assertEqual(len(response.data["failed"]), 1)
        self.assertIn("Invalid status", response.data["failed"][0]["error"])

    def test_idempotent_duplicate_retry(self):
        """Test resending the same progressId does not create duplicate DB rows."""
        self.client.force_authenticate(user=self.user1)
        payload = {
            "progressId": "prog-idempotent-001",
            "packageId": str(self.pkg_approved.id),
            "score": 85,
            "status": "COMPLETED"
        }

        # First request
        res1 = self.client.post("/api/progress/sync/", payload, format="json")
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res1.data["synced"]), 1)

        count_log_1 = SyncLog.objects.filter(idempotency_key="prog-idempotent-001").count()
        count_attempt_1 = StudentAttempt.objects.filter(lms_attempt_id="prog-idempotent-001").count()
        self.assertEqual(count_log_1, 1)
        self.assertEqual(count_attempt_1, 1)

        # Second request (retry)
        res2 = self.client.post("/api/progress/sync/", payload, format="json")
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res2.data["synced"]), 1)

        # Verify no duplicate rows
        count_log_2 = SyncLog.objects.filter(idempotency_key="prog-idempotent-001").count()
        count_attempt_2 = StudentAttempt.objects.filter(lms_attempt_id="prog-idempotent-001").count()
        self.assertEqual(count_log_2, 1)
        self.assertEqual(count_attempt_2, 1)

    def test_batch_and_partial_failure(self):
        """Test batch containing both valid and invalid records handles partial failure cleanly."""
        self.client.force_authenticate(user=self.user1)
        batch = [
            {
                "progressId": "batch-valid-1",
                "packageId": str(self.pkg_approved.id),
                "score": 95,
                "status": "COMPLETED"
            },
            {
                "progressId": "batch-invalid-2",
                "packageId": "non_existent_pkg",
                "score": 50,
                "status": "COMPLETED"
            },
            {
                "progressId": "batch-valid-3",
                "packageId": str(self.pkg_approved.id),
                "score": 75,
                "status": "IN_PROGRESS"
            }
        ]
        response = self.client.post("/api/progress/sync/", {"items": batch}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["synced"]), 2)
        self.assertEqual(len(response.data["failed"]), 1)

        synced_ids = [s["progressId"] for s in response.data["synced"]]
        self.assertIn("batch-valid-1", synced_ids)
        self.assertIn("batch-valid-3", synced_ids)
        self.assertEqual(response.data["failed"][0]["progressId"], "batch-invalid-2")

    def test_empty_batch(self):
        """Test empty batch payload returns empty lists."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.post("/api/progress/sync/", [], format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["synced"], [])
        self.assertEqual(response.data["failed"], [])

    def test_legacy_sync_endpoints_remain_functional(self):
        """Verify legacy /api/lms/sync/ endpoints still work."""
        self.client.force_authenticate(user=self.user1)

        # /api/lms/sync/attempt/
        res_attempt = self.client.post("/api/lms/sync/attempt/", [{
            "lms_attempt_id": "legacy-attempt-1",
            "experience_ref": str(self.exp_approved.id),
            "started_at": "2026-10-03T10:00:00Z"
        }], format="json")
        self.assertEqual(res_attempt.status_code, status.HTTP_200_OK)
