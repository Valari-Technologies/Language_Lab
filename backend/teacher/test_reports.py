from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from assessments.models import ExperienceAssignment, StudentAttempt
from school_admin.models import Class, Teacher, TeacherClass
from super_admin.models import Grade, School
from teacher.models import Student

User = get_user_model()
URL = "/api/cms/v1/teacher/reports/"


class TeacherReportsTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.grade3 = Grade.objects.create(grade_name="Class 3", sort_order=3)
        self.grade4 = Grade.objects.create(grade_name="Class 4", sort_order=4)
        self.school = School.objects.create(schoolId="SCH-A", school_name="A", address="1", phone="1", email="a@x.test")
        self.other = School.objects.create(schoolId="SCH-B", school_name="B", address="2", phone="2", email="b@x.test")
        self.teacher = self._teacher("teach3", self.school, self.grade3)
        self.s_a = self._student("AAA_1", self.school, "Class 3", "A")
        self.s_b = self._student("BBB_2", self.school, "Grade 3", "B")  # other section, same grade
        self.s_g4 = self._student("CCC_3", self.school, "Class 4", "A")
        self.s_other = self._student("DDD_4", self.other, "Class 3", "A")
        self.s_inactive = self._student("EEE_5", self.school, "Class 3", "A", active=False)

    def _teacher(self, username, school, grade):
        user = User.objects.create_user(username=username, password="x", role=User.Role.TEACHER)
        teacher = Teacher.objects.create(user=user, school=school)
        klass = Class.objects.create(school=school, class_name=f"{grade.grade_name}-A", grade=grade,
                                     academic_year="2026-2027")
        TeacherClass.objects.create(teacher=teacher, class_obj=klass)
        return user

    def _student(self, username, school, grade, section, active=True):
        user = User.objects.create_user(username=username, password="x", role=User.Role.STUDENT,
                                        full_name=f"Student {username}", is_active=active)
        return Student.objects.create(user=user, school=school, roll_no="1", grade=grade, section=section)

    def _attempt(self, student, ref, percentage, stars, level_key, status="COMPLETED"):
        assignment, _ = ExperienceAssignment.objects.get_or_create(
            school=student.school, experience_ref=ref, defaults={"experience_title": f"Lesson {ref}",
                                                                 "assigned_at": timezone.now()})
        return StudentAttempt.objects.create(
            assignment=assignment, student=student.user, school=student.school, started_at=timezone.now(),
            completed_at=timezone.now(), status=status, percentage=percentage, stars=stars, level_key=level_key,
            lms_attempt_id=f"{student.user.username}-{ref}-{percentage}-{stars}")

    def test_only_students_of_the_teachers_grade(self):
        self._attempt(self.s_a, "1", 80, 2, "L1")
        self._attempt(self.s_a, "1", 100, 3, "L1")  # better retry of the same level
        self._attempt(self.s_a, "2", 60, 1, "L2")
        self._attempt(self.s_b, "1", 70, 2, "L1")
        self._attempt(self.s_g4, "1", 10, 1, "L1")
        self._attempt(self.s_other, "1", 10, 1, "L1")
        self.api.force_authenticate(self.teacher)
        data = self.api.get(URL).json()
        names = [r["loginCode"] for r in data["students"]]
        self.assertEqual(names, ["AAA_1", "BBB_2"])  # both sections of the grade; not grade 4, other school, inactive
        row = data["students"][0]
        self.assertEqual((row["attempts"], row["completedLessons"], row["stars"]), (3, 2, 4))  # best stars per level 3 + 1
        self.assertEqual(row["averagePercent"], 80.0)
        self.assertIsNotNone(row["lastActivity"])
        self.assertEqual(data["summary"], {"students": 2, "attempts": 4, "averagePercent": 77.5, "completedLessons": 3})
        self.assertEqual(data["grades"], [{"id": self.grade3.id, "name": "Class 3"}])

    def test_unfinished_attempts_do_not_count_as_completed(self):
        self._attempt(self.s_a, "1", None, None, None, status="IN_PROGRESS")
        self.api.force_authenticate(self.teacher)
        row = self.api.get(URL).json()["students"][0]
        self.assertEqual((row["attempts"], row["completedLessons"], row["averagePercent"], row["stars"]), (1, 0, None, 0))

    def test_grade_filter_only_for_own_grades(self):
        self.api.force_authenticate(self.teacher)
        self.assertEqual(self.api.get(URL, {"grade_id": self.grade3.id}).json()["summary"]["students"], 2)
        self.assertEqual(self.api.get(URL, {"grade_id": self.grade4.id}).status_code, 400)
        self.assertEqual(self.api.get(URL, {"grade_id": "x"}).status_code, 400)

    def test_teacher_with_two_grades(self):
        klass = Class.objects.create(school=self.school, class_name="Class 4-A", grade=self.grade4, academic_year="2026-2027")
        TeacherClass.objects.create(teacher=Teacher.objects.get(user=self.teacher), class_obj=klass)
        self.api.force_authenticate(self.teacher)
        data = self.api.get(URL).json()
        self.assertEqual([g["name"] for g in data["grades"]], ["Class 3", "Class 4"])
        self.assertEqual(data["summary"]["students"], 3)
        self.assertEqual(self.api.get(URL, {"grade_id": self.grade4.id}).json()["summary"]["students"], 1)

    def test_teacher_without_classes_sees_nothing(self):
        user = User.objects.create_user(username="lonely", password="x", role=User.Role.TEACHER)
        Teacher.objects.create(user=user, school=self.school)
        self.api.force_authenticate(user)
        data = self.api.get(URL).json()
        self.assertEqual((data["students"], data["grades"], data["summary"]["students"]), ([], [], 0))

    def test_only_teachers(self):
        admin = User.objects.create_user(username="adm", password="x", role=User.Role.SCHOOL_ADMIN)
        for user in (admin, self.s_a.user):
            self.api.force_authenticate(user)
            self.assertEqual(self.api.get(URL).status_code, 403)
        self.api.force_authenticate(None)
        self.assertIn(self.api.get(URL).status_code, (401, 403))
