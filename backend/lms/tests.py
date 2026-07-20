from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from super_admin.models import School, Grade
from school_admin.models import Class
from teacher.models import Student


class LMSRollNumberAuthTests(TestCase):
    """
    Unit tests for LMS passwordless Roll Number Authentication ingestion endpoint (`POST /api/lms/login`).
    """

    def setUp(self):
        self.client = APIClient()

        # School & Grade setup
        self.school = School.objects.create(
            school_name="LMS Test Academy",
            address="123 Education Lane",
            phone="1234567890",
            email="lms@academy.edu"
        )
        self.grade = Grade.objects.create(
            grade_name="Grade 10",
            sort_order=10
        )
        self.class_obj = Class.objects.create(
            school=self.school,
            class_name="Section A",
            grade=self.grade,
            academic_year="2024-2025",
            is_active=True
        )

        # Student User
        self.student_user = User.objects.create_user(
            username="STU-2026-001",
            email="student1@lms.edu",
            password="Password123!",
            role="STUDENT",
            full_name="Amina Al-Mansoor",
            is_active=True
        )
        self.student_profile = Student.objects.create(
            user=self.student_user,
            school=self.school
        )

        # Inactive Student User
        self.inactive_user = User.objects.create_user(
            username="STU-INACTIVE-99",
            email="inactive@lms.edu",
            password="Password123!",
            role="STUDENT",
            full_name="Inactive Student",
            is_active=False
        )
        self.inactive_student = Student.objects.create(
            user=self.inactive_user,
            school=self.school
        )

        # Teacher User (non-student role)
        self.teacher_user = User.objects.create_user(
            username="TEACHER-01",
            email="teacher1@lms.edu",
            password="Password123!",
            role="TEACHER",
            full_name="Teacher One",
            is_active=True
        )
        self.teacher_as_student = Student.objects.create(
            user=self.teacher_user,
            school=self.school
        )

        self.login_url = "/api/lms/login/"

    def test_valid_roll_number_login_success(self):
        """Valid student roll number -> 200 OK with identity, school, grade, class, and SimpleJWT tokens."""
        response = self.client.post(self.login_url, {"roll_number": "STU-2026-001"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])

        self.assertIn("student", response.data)
        self.assertEqual(response.data["student"]["roll_number"], "STU-2026-001")
        self.assertEqual(response.data["student"]["full_name"], "Amina Al-Mansoor")

        self.assertIn("school", response.data)
        self.assertEqual(response.data["school"]["id"], self.school.school_id)
        self.assertEqual(response.data["school"]["name"], "LMS Test Academy")

        self.assertIn("grade", response.data)
        self.assertEqual(response.data["grade"]["name"], "Grade 10")

        self.assertIn("class_section", response.data)
        self.assertEqual(response.data["class_section"]["name"], "Section A")

    def test_missing_roll_number_returns_400(self):
        """Missing roll number payload -> 400 Bad Request."""
        response = self.client.post(self.login_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("roll_number", response.data)

    def test_non_existent_roll_number_returns_404(self):
        """Non-existent roll number -> 404 Not Found."""
        response = self.client.post(self.login_url, {"roll_number": "NON-EXISTENT-ROLL-99"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)

    def test_inactive_student_returns_403(self):
        """Inactive student account -> 403 Forbidden."""
        response = self.client.post(self.login_url, {"roll_number": "STU-INACTIVE-99"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error", response.data)

    def test_non_student_role_returns_403(self):
        """Non-student user role -> 403 Forbidden."""
        response = self.client.post(self.login_url, {"roll_number": "TEACHER-01"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error", response.data)


class LMSPackageAPITests(TestCase):
    """
    Unit tests for LMS Package Assignment Query, Download Streaming, and Update Sync APIs.
    """

    def setUp(self):
        import tempfile
        from content_studio.models import Experience, PublishedPackage, PublishVersion
        from assessments.models import ExperienceAssignment

        self.client = APIClient()

        # Temporary package directory
        self.temp_dir = tempfile.mkdtemp(prefix="lms_test_pkg_")

        # School A (Grade 10)
        self.school_a = School.objects.create(school_name="School Alpha", address="A St", phone="111", email="a@a.com")
        self.grade_10 = Grade.objects.create(grade_name="Grade 10", sort_order=10)
        self.class_a = Class.objects.create(school=self.school_a, class_name="10-A", grade=self.grade_10, academic_year="2024-2025")

        self.student_a_user = User.objects.create_user(username="student_a", password="pass", role="STUDENT")
        self.student_a = Student.objects.create(user=self.student_a_user, school=self.school_a)

        # School B (Grade 8)
        self.school_b = School.objects.create(school_name="School Beta", address="B St", phone="222", email="b@b.com")
        self.grade_8 = Grade.objects.create(grade_name="Grade 8", sort_order=8)
        self.class_b = Class.objects.create(school=self.school_b, class_name="8-B", grade=self.grade_8, academic_year="2024-2025")

        self.student_b_user = User.objects.create_user(username="student_b", password="pass", role="STUDENT")
        self.student_b = Student.objects.create(user=self.student_b_user, school=self.school_b)

        # Content Creator
        self.creator = User.objects.create_user(username="creator_lms", password="pass", role="CONTENT_CREATOR")

        # Package A (Grade 10)
        self.exp_a = Experience.objects.create(title="Physics Lab", grade=self.grade_10, status="PUBLISHED", created_by=self.creator, estimated_duration=30)
        self.pub_pkg_a = PublishedPackage.objects.create(experience=self.exp_a, package_name="Physics Lab", compression_status="COMPLETED")

        fake_elab_a = os.path.join(self.temp_dir, "physics_lab_v1.elab")
        with open(fake_elab_a, "wb") as f:
            f.write(b"PK_FAKE_ZIP_A_DATA")

        self.version_a = PublishVersion.objects.create(
            published_package=self.pub_pkg_a,
            version_number="1.0",
            build_number=1,
            package_size=18,
            file_path=fake_elab_a,
            checksum="a" * 64,
            published_by=self.creator
        )

        # Package B (Grade 8)
        self.exp_b = Experience.objects.create(title="Bio Basics", grade=self.grade_8, status="PUBLISHED", created_by=self.creator, estimated_duration=30)
        self.pub_pkg_b = PublishedPackage.objects.create(experience=self.exp_b, package_name="Bio Basics", compression_status="COMPLETED")

        fake_elab_b = os.path.join(self.temp_dir, "bio_basics_v1.elab")
        with open(fake_elab_b, "wb") as f:
            f.write(b"PK_FAKE_ZIP_B_DATA")

        self.version_b = PublishVersion.objects.create(
            published_package=self.pub_pkg_b,
            version_number="1.0",
            build_number=1,
            package_size=18,
            file_path=fake_elab_b,
            checksum="b" * 64,
            published_by=self.creator
        )

    def tearDown(self):
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_student_package_list_tenant_isolation(self):
        """Student A only lists packages matching Grade 10 / School A context."""
        self.client.force_authenticate(user=self.student_a_user)
        response = self.client.get("/api/lms/packages/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        titles = [p["title"] for p in response.data]
        self.assertIn("Physics Lab", titles)
        self.assertNotIn("Bio Basics", titles)

        # Student B gets Grade 8 package
        self.client.force_authenticate(user=self.student_b_user)
        response_b = self.client.get("/api/lms/packages/")
        self.assertEqual(response_b.status_code, status.HTTP_200_OK)
        titles_b = [p["title"] for p in response_b.data]
        self.assertIn("Bio Basics", titles_b)
        self.assertNotIn("Physics Lab", titles_b)

    def test_package_download_file_stream(self):
        """Download endpoint streams file with FileResponse and X-Package-Checksum header."""
        self.client.force_authenticate(user=self.student_a_user)
        download_url = f"/api/lms/packages/{self.version_a.id}/download/"
        response = self.client.get(download_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["X-Package-Checksum"], "a" * 64)
        self.assertIn("attachment", response["Content-Disposition"])
        self.assertIn("physics_lab_v1.elab", response["Content-Disposition"])

    def test_package_check_updates(self):
        """Check updates endpoint identifies newer versions available."""
        self.client.force_authenticate(user=self.student_a_user)

        # Client has older version "0.9" installed
        payload = {
            "packages": [
                {"experience_id": self.exp_a.id, "version": "0.9"}
            ]
        }
        response = self.client.post("/api/lms/packages/check-updates/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updates = response.data["updates_available"]
        self.assertEqual(len(updates), 1)
        self.assertEqual(updates[0]["title"], "Physics Lab")
        self.assertEqual(updates[0]["version"], "1.0")
        self.assertEqual(updates[0]["client_version"], "0.9")


class LMSDashboardAPITests(TestCase):
    """
    Unit tests for LMS Dashboard Aggregator View (`GET /api/lms/dashboard/`).
    """

    def setUp(self):
        from django.utils import timezone as django_timezone
        from assessments.models import ExperienceAssignment, StudentAttempt

        self.client = APIClient()
        self.school = School.objects.create(school_name="Dash Academy", address="D St", phone="333", email="d@d.com")
        self.grade = Grade.objects.create(grade_name="Grade 10", sort_order=10)
        self.class_obj = Class.objects.create(school=self.school, class_name="Section 10A", grade=self.grade, academic_year="2024-2025")

        self.student_user = User.objects.create_user(username="dash_student", password="pass", role="STUDENT", full_name="Dashboard Student")
        self.student = Student.objects.create(user=self.student_user, school=self.school)

        # Experience & Assignment
        self.assignment = ExperienceAssignment.objects.create(
            school=self.school,
            experience_ref="101",
            experience_title="Chemistry Intro",
            grade=self.grade,
            class_obj=self.class_obj,
            assigned_at=django_timezone.now()
        )

        # Attempt
        self.attempt = StudentAttempt.objects.create(
            assignment=self.assignment,
            student=self.student_user,
            school=self.school,
            started_at=django_timezone.now(),
            completed_at=django_timezone.now(),
            status="COMPLETED",
            total_score=85,
            max_score=100,
            percentage=85.00,
            lms_attempt_id="ATT-DASH-101"
        )

    def test_dashboard_aggregator_metrics(self):
        """Dashboard aggregator returns student profile, assigned packages count, last_lesson, and progress summary."""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get("/api/lms/dashboard/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("student", response.data)
        self.assertEqual(response.data["student"]["roll_number"], "dash_student")
        self.assertEqual(response.data["student"]["school"], "Dash Academy")

        self.assertIn("progress_summary", response.data)
        self.assertEqual(response.data["progress_summary"]["completed_count"], 1)

        self.assertIn("last_lesson", response.data)
        self.assertIsNotNone(response.data["last_lesson"])
        self.assertEqual(response.data["last_lesson"]["experience_title"], "Chemistry Intro")


class LMSSyncAPITests(TestCase):
    """
    Unit tests for LMS Transactional Ingestion Sync APIs (`POST /api/lms/sync/*`).
    """

    def setUp(self):
        from assessments.models import StudentAttempt

        self.client = APIClient()
        self.school = School.objects.create(school_name="Sync Academy", address="S St", phone="444", email="s@s.com")
        self.student_user = User.objects.create_user(username="sync_student", password="pass", role="STUDENT")
        self.student = Student.objects.create(user=self.student_user, school=self.school)

    def test_atomic_attempt_and_progress_sync(self):
        """Attempts and progress screen logs ingest wrapped in row-level atomic blocks."""
        from assessments.models import StudentAttempt

        self.client.force_authenticate(user=self.student_user)

        # 1. Sync Attempt
        attempt_payload = [
            {
                "lms_attempt_id": "LMS-SYNC-999",
                "experience_ref": "202",
                "experience_title": "Grammar Basics",
                "started_at": "2026-07-20T10:00:00Z",
                "status": "IN_PROGRESS"
            }
        ]
        res_att = self.client.post("/api/lms/sync/attempt/", attempt_payload, format="json")
        self.assertEqual(res_att.status_code, status.HTTP_200_OK)
        self.assertEqual(res_att.data["processed"], 1)
        self.assertEqual(res_att.data["failed"], 0)

        # Verify DB attempt created
        self.assertTrue(StudentAttempt.objects.filter(lms_attempt_id="LMS-SYNC-999").exists())

        # 2. Sync Progress
        progress_payload = [
            {
                "lms_attempt_id": "LMS-SYNC-999",
                "screen_ref": "screen-1",
                "screen_title": "Intro Screen",
                "screen_type": "INFORMATION",
                "response_data": {"viewed": True},
                "score": 10.0,
                "max_score": 10.0,
                "is_correct": True
            }
        ]
        res_prog = self.client.post("/api/lms/sync/progress/", progress_payload, format="json")
        self.assertEqual(res_prog.status_code, status.HTTP_200_OK)
        self.assertEqual(res_prog.data["processed"], 1)

        # 3. Sync Completion
        completion_payload = [
            {
                "lms_attempt_id": "LMS-SYNC-999",
                "completed_at": "2026-07-20T10:15:00Z",
                "percentage": 100.0,
                "total_score": 10.0,
                "max_score": 10.0
            }
        ]
        res_comp = self.client.post("/api/lms/sync/completion/", completion_payload, format="json")
        self.assertEqual(res_comp.status_code, status.HTTP_200_OK)
        self.assertEqual(res_comp.data["processed"], 1)

        # Verify attempt status updated to COMPLETED
        att = StudentAttempt.objects.get(lms_attempt_id="LMS-SYNC-999")
        self.assertEqual(att.status, "COMPLETED")


