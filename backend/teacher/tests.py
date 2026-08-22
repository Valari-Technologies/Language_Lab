from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from super_admin.models import Grade, School
from school_admin.models import Class, Teacher, TeacherClass
from teacher.models import Student

User = get_user_model()


class TeacherStudentVisibilityTests(TestCase):
    def setUp(self):
        # Create a school
        self.school = School.objects.create(
            school_name="Test School",
            address="123 Road",
            phone="12345",
            email="school@test.com"
        )
        
        # Create Teacher user
        self.teacher_user = User.objects.create_user(
            username="teacher_mirtuthula",
            password="password123",
            email="mirtuthula@test.com",
            role="TEACHER",
            full_name="Mirthuthula"
        )
        self.teacher_profile = Teacher.objects.create(
            user=self.teacher_user,
            school=self.school
        )

        # Create Grades
        self.grade_7 = Grade.objects.create(grade_name="Class 7", sort_order=7)
        self.grade_6 = Grade.objects.create(grade_name="Class 6", sort_order=6)

        # Create Classes
        self.class_7c = Class.objects.create(
            school=self.school,
            class_name="Class 7-C",
            grade=self.grade_7,
            academic_year="2025 - 2026",
            is_active=True
        )
        self.class_6a = Class.objects.create(
            school=self.school,
            class_name="Class 6-A",
            grade=self.grade_6,
            academic_year="2025 - 2026",
            is_active=True
        )

        # Assign Teacher to Class 7-C
        TeacherClass.objects.create(
            teacher=self.teacher_profile,
            class_obj=self.class_7c
        )

        # Create Students
        self.student_a_user = User.objects.create_user(
            username="student_a",
            password="password123",
            role="STUDENT",
            full_name="Student A"
        )
        self.student_a = Student.objects.create(
            user=self.student_a_user,
            school=self.school,
            grade="Class 7",
            section="C",
            academic_year="2025 - 2026"
        )

        self.student_b_user = User.objects.create_user(
            username="student_b",
            password="password123",
            role="STUDENT",
            full_name="Student B"
        )
        self.student_b = Student.objects.create(
            user=self.student_b_user,
            school=self.school,
            grade="Class 6",
            section="A",
            academic_year="2025 - 2026"
        )

        # Generate JWT Token for teacher
        self.token = str(RefreshToken.for_user(self.teacher_user).access_token)

    def test_teacher_can_only_view_assigned_class_students(self):
        url = reverse("student-list")
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {self.token}'
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify only Student A (from Class 7-C) is visible, Student B (from Class 6-A) is not
        results = response.data
        if isinstance(results, dict) and "results" in results:
            results = results["results"]
            
        student_ids = [s["student_id"] for s in results]
        self.assertIn(self.student_a.student_id, student_ids)
        self.assertNotIn(self.student_b.student_id, student_ids)
        self.assertEqual(len(results), 1)
