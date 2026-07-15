from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import csv
import io

from super_admin.models import School, Grade, SchoolAdminProfile
from school_admin.models import Class, Teacher, TeacherClass
from teacher.models import Student
from .models import ScenarioAssignment, StudentAttempt, ScreenResponse

User = get_user_model()


class AssessmentsTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Schools
        self.school_a = School.objects.create(
            school_name="School A",
            address="123 Street A",
            phone="111111",
            email="schoola@test.com"
        )
        self.school_b = School.objects.create(
            school_name="School B",
            address="456 Street B",
            phone="222222",
            email="schoolb@test.com"
        )

        # Create Grade
        self.grade_6 = Grade.objects.create(
            grade_name="Grade 6",
            sort_order=6
        )

        # Create Classes
        self.class_a = Class.objects.create(
            school=self.school_a,
            class_name="Class A-1",
            grade=self.grade_6,
            academic_year="2026",
            is_active=True
        )
        self.class_b = Class.objects.create(
            school=self.school_b,
            class_name="Class B-1",
            grade=self.grade_6,
            academic_year="2026",
            is_active=True
        )

        # Create Users & Profiles
        self.admin_user_a = User.objects.create_user(
            username="admin_a",
            password="password123",
            role=User.Role.SCHOOL_ADMIN
        )
        SchoolAdminProfile.objects.create(user=self.admin_user_a, school=self.school_a)

        self.admin_user_b = User.objects.create_user(
            username="admin_b",
            password="password123",
            role=User.Role.SCHOOL_ADMIN
        )
        SchoolAdminProfile.objects.create(user=self.admin_user_b, school=self.school_b)

        # Create Teachers
        self.teacher_user_a = User.objects.create_user(
            username="teacher_a",
            password="password123",
            role=User.Role.TEACHER
        )
        self.teacher_a = Teacher.objects.create(user=self.teacher_user_a, school=self.school_a)
        TeacherClass.objects.create(teacher=self.teacher_a, class_obj=self.class_a)

        # Create Students
        self.student_user_a = User.objects.create_user(
            username="student_a",
            password="password123",
            role=User.Role.STUDENT,
            full_name="Student A Name"
        )
        Student.objects.create(user=self.student_user_a, school=self.school_a)

        self.student_user_b = User.objects.create_user(
            username="student_b",
            password="password123",
            role=User.Role.STUDENT,
            full_name="Student B Name"
        )
        Student.objects.create(user=self.student_user_b, school=self.school_b)

        # Get JWT Tokens
        self.token_a = self.get_token("admin_a")
        self.token_b = self.get_token("admin_b")

    def get_token(self, username):
        url = reverse("login")
        response = self.client.post(url, {"username": username, "password": "password123"}, format="json")
        return response.data["access"]

    def test_sync_assignments_success(self):
        url = reverse("sync_assignments")
        payload = [
            {
                "scenario_ref": "scen_1",
                "scenario_title": "Scenario One",
                "grade": self.grade_6.id,
                "class_obj": self.class_a.class_id,
                "assigned_by_username": "teacher_a",
                "assigned_at": timezone.now().isoformat()
            }
        ]
        response = self.client.post(url, payload, format="json", HTTP_AUTHORIZATION=f"Bearer {self.token_a}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["created"], 1)
        self.assertEqual(response.data["failed"], 0)
        self.assertTrue(ScenarioAssignment.objects.filter(scenario_ref="scen_1", school=self.school_a).exists())

    def test_sync_assignments_invalid_class_fails_row(self):
        # Class B belongs to School B, but synced using Admin A (School A)
        url = reverse("sync_assignments")
        payload = [
            {
                "scenario_ref": "scen_1",
                "scenario_title": "Scenario One",
                "grade": self.grade_6.id,
                "class_obj": self.class_b.class_id,  # Invalid class for School A
                "assigned_by_username": "teacher_a",
                "assigned_at": timezone.now().isoformat()
            }
        ]
        response = self.client.post(url, payload, format="json", HTTP_AUTHORIZATION=f"Bearer {self.token_a}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["created"], 0)
        self.assertEqual(response.data["failed"], 1)
        self.assertIn("Class does not belong to school", response.data["errors"][0]["errors"])

    def test_sync_attempts_and_deduplication(self):
        # 1. First sync valid attempt
        url = reverse("sync_attempts")
        payload = [
            {
                "lms_attempt_id": "attempt_1",
                "scenario_ref": "scen_1",
                "student_username": "student_a",
                "started_at": timezone.now().isoformat(),
                "completed_at": (timezone.now() + timedelta(minutes=15)).isoformat(),
                "status": "COMPLETED",
                "total_score": 60,
                "max_score": 100,
                "percentage": 60,
                "time_spent_seconds": 900
            }
        ]
        response = self.client.post(url, payload, format="json", HTTP_AUTHORIZATION=f"Bearer {self.token_a}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["created"], 1)
        self.assertEqual(StudentAttempt.objects.get(lms_attempt_id="attempt_1").percentage, 60)

        # 2. Sync attempt with same lms_attempt_id (Deduplication / Update check)
        payload[0]["percentage"] = 80
        payload[0]["total_score"] = 80
        response = self.client.post(url, payload, format="json", HTTP_AUTHORIZATION=f"Bearer {self.token_a}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["updated"], 1)
        self.assertEqual(StudentAttempt.objects.count(), 1)
        self.assertEqual(StudentAttempt.objects.get(lms_attempt_id="attempt_1").percentage, 80)

    def test_sync_attempts_invalid_student_rejected(self):
        # student_b is School B, but sync is posted by Admin A (School A)
        url = reverse("sync_attempts")
        payload = [
            {
                "lms_attempt_id": "attempt_2",
                "scenario_ref": "scen_1",
                "student_username": "student_b",
                "started_at": timezone.now().isoformat(),
                "status": "STARTED"
            }
        ]
        response = self.client.post(url, payload, format="json", HTTP_AUTHORIZATION=f"Bearer {self.token_a}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["failed"], 1)
        self.assertIn("does not belong to school", response.data["errors"][0]["errors"])

    def test_reports_empty_and_scoping(self):
        # 1. Admin A overview when no sync has occurred
        url = reverse("reports_overview")
        response = self.client.post(reverse("login"), {"username": "admin_a", "password": "password123"}, format="json")
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token_a}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_students"], 0)
        self.assertEqual(response.data["completion_rate"], 0.0)

        # 2. Sync an attempt under School A
        assignment = ScenarioAssignment.objects.create(
            school=self.school_a,
            scenario_ref="scen_1",
            scenario_title="Scenario One",
            class_obj=self.class_a,
            assigned_at=timezone.now()
        )
        StudentAttempt.objects.create(
            assignment=assignment,
            student=self.student_user_a,
            school=self.school_a,
            started_at=timezone.now(),
            completed_at=timezone.now() + timedelta(minutes=10),
            status="COMPLETED",
            total_score=80.0,
            max_score=100.0,
            percentage=80.0,
            time_spent_seconds=600,
            lms_attempt_id="attempt_scoped_1"
        )

        # 3. Check reports overview for School A
        response_a = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token_a}")
        self.assertEqual(response_a.data["total_students"], 1)
        self.assertEqual(response_a.data["average_score"], 80.0)

        # 4. Check reports overview for School B (should see 0 due to isolation)
        response_b = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token_b}")
        self.assertEqual(response_b.data["total_students"], 0)
        self.assertEqual(response_b.data["average_score"], 0.0)

    def test_reports_export_csv(self):
        # Setup data
        assignment = ScenarioAssignment.objects.create(
            school=self.school_a,
            scenario_ref="scen_1",
            scenario_title="Scenario One",
            class_obj=self.class_a,
            assigned_at=timezone.now()
        )
        StudentAttempt.objects.create(
            assignment=assignment,
            student=self.student_user_a,
            school=self.school_a,
            started_at=timezone.now(),
            status="COMPLETED",
            percentage=85.0,
            lms_attempt_id="attempt_csv"
        )

        url = reverse("reports_export") + "?type=students"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token_a}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv")
        self.assertIn("report_students_", response.headers["Content-Disposition"])

        content = response.content.decode("utf-8")
        reader = csv.reader(io.StringIO(content))
        rows = list(reader)
        self.assertGreater(len(rows), 1)
        self.assertEqual(rows[0][0], "Student ID")
        self.assertEqual(rows[1][1], "Student A Name")
