from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import csv
import io
from rest_framework_simplejwt.tokens import RefreshToken

from super_admin.models import School, Grade, SchoolAdminProfile
from school_admin.models import Class, Teacher, TeacherClass
from teacher.models import Student
from .models import ExperienceAssignment, StudentAttempt, ScreenResponse

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
                "experience_ref": "scen_1",
                "experience_title": "Experience One",
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
        self.assertTrue(ExperienceAssignment.objects.filter(experience_ref="scen_1", school=self.school_a).exists())

    def test_sync_assignments_invalid_class_fails_row(self):
        # Class B belongs to School B, but synced using Admin A (School A)
        url = reverse("sync_assignments")
        payload = [
            {
                "experience_ref": "scen_1",
                "experience_title": "Experience One",
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
                "experience_ref": "scen_1",
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
                "experience_ref": "scen_1",
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
        assignment = ExperienceAssignment.objects.create(
            school=self.school_a,
            experience_ref="scen_1",
            experience_title="Experience One",
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
        assignment = ExperienceAssignment.objects.create(
            school=self.school_a,
            experience_ref="scen_1",
            experience_title="Experience One",
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

    def test_reports_student_completion_permissions(self):
        url = reverse("reports_student_completion")
        
        # 1. Anonymous user -> 401
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # 2. Student user -> 403
        token_student_a = str(RefreshToken.for_user(self.student_user_a).access_token)
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token_student_a}")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # 3. Teacher user -> 200
        token_teacher_a = self.get_token("teacher_a")
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token_teacher_a}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 4. School Admin -> 200
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token_a}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_reports_student_completion_metrics_and_scoping(self):
        url = reverse("reports_student_completion")
        
        # Clear existing assignments & attempts to make test calculations predictable
        ExperienceAssignment.objects.all().delete()
        StudentAttempt.objects.all().delete()
        
        # Create assignments under School A
        assignment_a1 = ExperienceAssignment.objects.create(
            school=self.school_a,
            experience_ref="scen_a1",
            experience_title="Experience A1",
            class_obj=self.class_a,
            assigned_at=timezone.now()
        )
        assignment_a2 = ExperienceAssignment.objects.create(
            school=self.school_a,
            experience_ref="scen_a2",
            experience_title="Experience A2",
            class_obj=self.class_a,
            assigned_at=timezone.now()
        )
        
        # Student A (School A) attempts and completes one experience
        StudentAttempt.objects.create(
            assignment=assignment_a1,
            student=self.student_user_a,
            school=self.school_a,
            started_at=timezone.now(),
            completed_at=timezone.now() + timedelta(minutes=5),
            status="COMPLETED",
            lms_attempt_id="attempt_a1"
        )
        # Student A starts but does not complete another attempt
        StudentAttempt.objects.create(
            assignment=assignment_a2,
            student=self.student_user_a,
            school=self.school_a,
            started_at=timezone.now(),
            status="STARTED",
            lms_attempt_id="attempt_a2"
        )

        # School Admin A checks reports
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token_a}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see student_a with correct metrics
        student_data = [item for item in response.data if item["student_id"] == self.student_user_a.id][0]
        self.assertEqual(student_data["total_assigned_experiences"], 2)
        self.assertEqual(student_data["completed_experiences_count"], 1)

        # Teacher A checks reports (teacher is assigned to class_a, which includes class_a attempts)
        token_teacher_a = self.get_token("teacher_a")
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token_teacher_a}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        student_data_teacher = [item for item in response.data if item["student_id"] == self.student_user_a.id][0]
        self.assertEqual(student_data_teacher["total_assigned_experiences"], 2)
        self.assertEqual(student_data_teacher["completed_experiences_count"], 1)
        
        # School Admin B checks reports (should NOT see School A's student metrics due to isolation)
        response_b = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token_b}")
        self.assertEqual(response_b.status_code, status.HTTP_200_OK)
        # student_a should not be in the response data for School B
        student_ids_b = [item["student_id"] for item in response_b.data]
        self.assertNotIn(self.student_user_a.id, student_ids_b)

