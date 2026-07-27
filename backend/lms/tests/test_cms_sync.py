import os
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from super_admin.models import School, Grade
from school_admin.models import Class
from teacher.models import Student

class LMSCMSSyncTests(TestCase):
    """
    Unit tests for CMS-side Sync Ingestion and Outbound pull-updates APIs.
    """

    def setUp(self):
        self.client = APIClient()

        # School setup
        self.school = School.objects.create(
            school_name="LMS Sync Academy",
            address="456 Telemetry Way",
            phone="0987654321",
            email="sync@academy.edu"
        )
        
        # Student User
        self.student_user = User.objects.create_user(
            username="STU-SYNC-001",
            email="sync_student@lms.edu",
            password="Password123!",
            role="STUDENT",
            full_name="Diana Prince",
            is_active=True
        )
        self.student_profile = Student.objects.create(
            user=self.student_user,
            school=self.school,
            roll_no="ROLL-SYNC-99",
            grade="Grade 10",
            section="A"
        )

        # Grade setup
        self.grade = Grade.objects.create(
            grade_name="Grade 10",
            sort_order=10
        )

        # Create dummy experience, published package and version
        from content_studio.models import Experience, PublishedPackage, PublishVersion
        from django.utils import timezone
        from assessments.models import ExperienceAssignment

        self.experience = Experience.objects.create(
            title="LMS Inbound Speaking",
            subject="Speaking & Listening",
            status="PUBLISHED",
            difficulty="MEDIUM",
            estimated_duration=20,
            created_by=self.student_user,
            grade=self.grade
        )

        self.pub_package = PublishedPackage.objects.create(
            experience=self.experience,
            package_name="lms_inbound_speaking",
            output_format=".elab",
            compression_status="COMPLETED"
        )

        self.pub_version = PublishVersion.objects.create(
            published_package=self.pub_package,
            version_number="1.0.0",
            build_number=1,
            package_size=1024,
            download_url="http://localhost:8000/media/lms_inbound_speaking.elab",
            checksum="dummy_checksum_123"
        )

        # Assign experience to school
        self.assignment = ExperienceAssignment.objects.create(
            school=self.school,
            experience_ref=str(self.experience.id),
            experience_title=self.experience.title,
            assigned_at=timezone.now()
        )

    def test_ingest_reports_success(self):
        """Inbound ingest-reports endpoint creates StudentProgress, QuizAttempt and ActivityReport."""
        payload = {
            "deviceId": "device_lms_01",
            "studentRollNumber": "ROLL-SYNC-99",
            "syncedAt": "2026-07-25T12:00:00Z",
            "reports": [
                {
                    "idempotencyKey": "key_unique_telemetry_001",
                    "scenarioId": str(self.experience.id),
                    "activityId": "activity_01",
                    "screenId": "screen_01",
                    "score": 8,
                    "maxScore": 10,
                    "timeSpentSeconds": 45,
                    "completed": True,
                    "answers": {"question_1": "A"},
                    "timestamp": "2026-07-25T11:45:00Z"
                }
            ]
        }
        response = self.client.post("/api/v1/lms/sync/ingest-reports/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("processedKeys", response.data)
        self.assertIn("key_unique_telemetry_001", response.data["processedKeys"])

        # Check SyncLog
        from lms.models import SyncLog, StudentProgress, QuizAttempt, ActivityReport
        self.assertTrue(SyncLog.objects.filter(idempotency_key="key_unique_telemetry_001").exists())

        # Check StudentProgress
        self.assertTrue(StudentProgress.objects.filter(student=self.student_profile, scenario_id=str(self.experience.id)).exists())
        progress = StudentProgress.objects.get(student=self.student_profile, scenario_id=str(self.experience.id))
        self.assertTrue(progress.completed)
        self.assertEqual(progress.total_time_spent, 45)

        # Check QuizAttempt
        self.assertTrue(QuizAttempt.objects.filter(student=self.student_profile, screen_id="screen_01").exists())
        quiz = QuizAttempt.objects.get(student=self.student_profile, screen_id="screen_01")
        self.assertEqual(quiz.score, 8)
        self.assertEqual(quiz.max_score, 10)
        self.assertEqual(quiz.answers, {"question_1": "A"})

        # Check ActivityReport
        self.assertTrue(ActivityReport.objects.filter(student=self.student_profile, activity_id="activity_01").exists())

    def test_ingest_reports_idempotency(self):
        """Duplicate report ingest payloads with same idempotencyKey do not result in duplicate records."""
        payload = {
            "deviceId": "device_lms_01",
            "studentRollNumber": "ROLL-SYNC-99",
            "syncedAt": "2026-07-25T12:00:00Z",
            "reports": [
                {
                    "idempotencyKey": "key_idempotent_111",
                    "scenarioId": str(self.experience.id),
                    "activityId": "activity_01",
                    "screenId": "screen_01",
                    "score": 9,
                    "maxScore": 10,
                    "timeSpentSeconds": 30,
                    "completed": True,
                    "answers": {"question_1": "B"},
                    "timestamp": "2026-07-25T11:45:00Z"
                }
            ]
        }
        
        # First request
        r1 = self.client.post("/api/v1/lms/sync/ingest-reports/", payload, format="json")
        self.assertEqual(r1.status_code, status.HTTP_200_OK)

        # Second request with exact same payload
        r2 = self.client.post("/api/v1/lms/sync/ingest-reports/", payload, format="json")
        self.assertEqual(r2.status_code, status.HTTP_200_OK)

        # Assert no duplicate database rows
        from lms.models import SyncLog, StudentProgress, QuizAttempt, ActivityReport
        self.assertEqual(SyncLog.objects.filter(idempotency_key="key_idempotent_111").count(), 1)
        self.assertEqual(QuizAttempt.objects.filter(student=self.student_profile, scenario_id=str(self.experience.id)).count(), 1)
        self.assertEqual(ActivityReport.objects.filter(student=self.student_profile, scenario_id=str(self.experience.id)).count(), 1)

    def test_pull_updates(self):
        """Pull updates returns latest elab package metadata assigned to the student's school."""
        response = self.client.get("/api/v1/lms/sync/pull-updates/", {"school_id": self.school.school_id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("updates", response.data)
        self.assertEqual(len(response.data["updates"]), 1)
        self.assertEqual(response.data["updates"][0]["experience_id"], self.experience.id)
        self.assertEqual(response.data["updates"][0]["version"], "1.0.0")
        self.assertEqual(response.data["updates"][0]["checksum"], "dummy_checksum_123")
