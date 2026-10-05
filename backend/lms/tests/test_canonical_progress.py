from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from super_admin.models import School, Grade
from teacher.models import Student
from content_studio.models import Experience, PublishedPackage
from assessments.models import ExperienceAssignment, StudentAttempt, ScreenResponse
from lms.models import SyncLog

User = get_user_model()


class CanonicalProgressListAPITestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create School & Grade
        cls.school = School.objects.create(
            school_name="Westfield High",
            address="789 Elm St",
            phone="5551234567",
            email="westfield@school.edu"
        )
        cls.grade = Grade.objects.create(
            grade_name="Grade 9",
            sort_order=9
        )

        # Student A (Alice)
        cls.user_a = User.objects.create_user(
            username="alice_stu",
            password="Password123!",
            role=User.Role.STUDENT,
            full_name="Alice Adams"
        )
        cls.student_a = Student.objects.create(
            user=cls.user_a,
            school=cls.school,
            roll_no="STU-A-01",
            grade="Grade 9"
        )

        # Student B (Bob)
        cls.user_b = User.objects.create_user(
            username="bob_stu",
            password="Password123!",
            role=User.Role.STUDENT,
            full_name="Bob Brown"
        )
        cls.student_b = Student.objects.create(
            user=cls.user_b,
            school=cls.school,
            roll_no="STU-B-02",
            grade="Grade 9"
        )

        # Student C (Charlie - has zero progress)
        cls.user_c = User.objects.create_user(
            username="charlie_stu",
            password="Password123!",
            role=User.Role.STUDENT,
            full_name="Charlie Clark"
        )
        cls.student_c = Student.objects.create(
            user=cls.user_c,
            school=cls.school,
            roll_no="STU-C-03",
            grade="Grade 9"
        )

        # Content Creator & Experiences
        cls.author = User.objects.create_user(
            username="teacher_prog",
            password="Password123!",
            role=User.Role.CONTENT_CREATOR
        )
        cls.exp1 = Experience.objects.create(
            title="English Literature 101",
            grade=cls.grade,
            subject="English",
            language="English",
            difficulty="INTERMEDIATE",
            estimated_duration=45,
            status=Experience.Status.APPROVED,
            created_by=cls.author,
            is_deleted=False
        )
        cls.exp2 = Experience.objects.create(
            title="Creative Writing",
            grade=cls.grade,
            subject="English",
            language="English",
            difficulty="BEGINNER",
            estimated_duration=30,
            status=Experience.Status.APPROVED,
            created_by=cls.author,
            is_deleted=False
        )

        # Assignments
        cls.assignment1 = ExperienceAssignment.objects.create(
            school=cls.school,
            experience_ref=str(cls.exp1.id),
            experience_title=cls.exp1.title,
            assigned_at="2026-10-01T00:00:00Z"
        )
        cls.assignment2 = ExperienceAssignment.objects.create(
            school=cls.school,
            experience_ref=str(cls.exp2.id),
            experience_title=cls.exp2.title,
            assigned_at="2026-10-01T00:00:00Z"
        )

        # Attempts for Alice (Student A)
        cls.attempt_a1 = StudentAttempt.objects.create(
            lms_attempt_id="att-alice-001",
            assignment=cls.assignment1,
            student=cls.user_a,
            school=cls.school,
            started_at="2026-10-02T10:00:00Z",
            completed_at="2026-10-02T10:30:00Z",
            status="COMPLETED",
            total_score=95.0,
            max_score=100.0,
            percentage=95.0,
            time_spent_seconds=1800
        )
        cls.scr_resp_a1 = ScreenResponse.objects.create(
            attempt=cls.attempt_a1,
            school=cls.school,
            screen_ref="scr-lit-1",
            screen_title="Introduction to Shakespeare",
            screen_type="QUIZ",
            score=95.0,
            max_score=100.0,
            is_correct=True,
            time_spent_seconds=300,
            response_data={"q1": "selected_a"}
        )
        SyncLog.objects.create(
            idempotency_key="att-alice-001",
            device_id="DEVICE-ALICE-LAPTOP",
            student_roll_no="STU-A-01"
        )

        cls.attempt_a2 = StudentAttempt.objects.create(
            lms_attempt_id="att-alice-002",
            assignment=cls.assignment2,
            student=cls.user_a,
            school=cls.school,
            started_at="2026-10-03T11:00:00Z",
            status="IN_PROGRESS",
            total_score=50.0,
            max_score=100.0,
            percentage=50.0,
            time_spent_seconds=600
        )

        # Attempts for Bob (Student B)
        cls.attempt_b1 = StudentAttempt.objects.create(
            lms_attempt_id="att-bob-001",
            assignment=cls.assignment1,
            student=cls.user_b,
            school=cls.school,
            started_at="2026-10-02T12:00:00Z",
            completed_at="2026-10-02T12:45:00Z",
            status="COMPLETED",
            total_score=70.0,
            max_score=100.0,
            percentage=70.0,
            time_spent_seconds=2700
        )

    def setUp(self):
        self.client = APIClient()

    def test_unauthenticated_request_returns_401(self):
        """Test GET /api/progress/ returns 401 for unauthenticated requests."""
        response = self.client.get("/api/progress/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_student_receives_own_progress(self):
        """Test authenticated student Alice receives only her 2 attempts with complete fields."""
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get("/api/progress/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertTrue(data["success"])
        self.assertEqual(data["studentId"], "STU-A-01")
        self.assertEqual(len(data["progress"]), 2)

        p_ids = [p["progressId"] for p in data["progress"]]
        self.assertIn("att-alice-001", p_ids)
        self.assertIn("att-alice-002", p_ids)
        self.assertNotIn("att-bob-001", p_ids)

        # Inspect details of completed attempt
        att1 = next(p for p in data["progress"] if p["progressId"] == "att-alice-001")
        self.assertEqual(att1["packageId"], str(self.exp1.id))
        self.assertEqual(att1["status"], "COMPLETED")
        self.assertEqual(att1["score"], 95.0)
        self.assertEqual(att1["percentage"], 95.0)
        self.assertEqual(att1["deviceId"], "DEVICE-ALICE-LAPTOP")
        self.assertEqual(len(att1["screens"]), 1)
        self.assertEqual(att1["screens"][0]["screenTitle"], "Introduction to Shakespeare")

    def test_cross_student_access_prevented(self):
        """Test Alice attempting to pass Bob's studentId gets 403 or receives none of Bob's records."""
        self.client.force_authenticate(user=self.user_a)

        # Alice passes studentId=STU-B-02 (Bob's ID)
        response = self.client.get("/api/progress/?studentId=STU-B-02")
        # Should be rejected with 403 Forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # If Alice passes student_id=bob_stu
        response_username = self.client.get("/api/progress/?studentId=bob_stu")
        self.assertEqual(response_username.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_with_zero_progress(self):
        """Test Charlie (who has no records) receives an empty progress array."""
        self.client.force_authenticate(user=self.user_c)
        response = self.client.get("/api/progress/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["progress"], [])

    def test_package_filtering(self):
        """Test filtering progress by packageId."""
        self.client.force_authenticate(user=self.user_a)

        # Filter by exp1
        res1 = self.client.get(f"/api/progress/?packageId={self.exp1.id}")
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res1.data["progress"]), 1)
        self.assertEqual(res1.data["progress"][0]["progressId"], "att-alice-001")

        # Filter by exp2
        res2 = self.client.get(f"/api/progress/?packageId={self.exp2.id}")
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res2.data["progress"]), 1)
        self.assertEqual(res2.data["progress"][0]["progressId"], "att-alice-002")

        # Filter by non-existent package
        res_none = self.client.get("/api/progress/?packageId=999999")
        self.assertEqual(res_none.status_code, status.HTTP_200_OK)
        self.assertEqual(res_none.data["progress"], [])

    def test_sibling_sync_and_package_endpoints_unaffected(self):
        """Verify POST /api/progress/sync/, GET /api/packages/ remain fully functional."""
        self.client.force_authenticate(user=self.user_a)

        # POST /api/progress/sync/
        res_sync = self.client.post("/api/progress/sync/", {
            "progressId": "att-alice-new-003",
            "packageId": str(self.exp1.id),
            "score": 88,
            "status": "COMPLETED"
        }, format="json")
        self.assertEqual(res_sync.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_sync.data["synced"]), 1)

        # GET /api/packages/
        res_pkgs = self.client.get("/api/packages/")
        self.assertEqual(res_pkgs.status_code, status.HTTP_200_OK)
