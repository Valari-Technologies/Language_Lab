from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from assessments.models import ExperienceAssignment, StudentAttempt
from content_studio.models import Experience
from super_admin.models import Grade, School, SchoolAdminProfile
from teacher.models import Student

User = get_user_model()


class StudentDetailReportTests(TestCase):
    """The School Admin student detail tells lessons from assessments and keeps a score of 0."""

    def setUp(self):
        self.api = APIClient()
        self.grade = Grade.objects.create(grade_name="Class 5", sort_order=5)
        self.school = School.objects.create(schoolId="SCH-A", school_name="A", address="1", phone="1", email="a@x.test")
        admin = User.objects.create_user(username="admin", password="x", role=User.Role.SCHOOL_ADMIN)
        SchoolAdminProfile.objects.create(user=admin, school=self.school)
        self.api.force_authenticate(admin)
        user = User.objects.create_user(username="RAV_01", password="x", role=User.Role.STUDENT, full_name="Ravi")
        self.student = Student.objects.create(user=user, school=self.school, roll_no="1", grade="Class 5", section="A")
        self.author = User.objects.create_user(username="author", password="x", role=User.Role.CONTENT_CREATOR)

    def _attempt(self, title, experience_type, score=None, maximum=None, percentage=None, level_key=None, ref=None):
        exp = Experience.objects.create(title=title, grade=self.grade, subject="English", language="English",
                                        difficulty="BEGINNER", estimated_duration=10, experience_type=experience_type,
                                        status="APPROVED", created_by=self.author)
        assignment = ExperienceAssignment.objects.create(
            school=self.school, experience_ref=ref or str(exp.id), experience_title=title, assigned_at=timezone.now())
        return StudentAttempt.objects.create(
            assignment=assignment, student=self.student.user, school=self.school, started_at=timezone.now(),
            completed_at=timezone.now(), status="COMPLETED", total_score=score, max_score=maximum,
            percentage=percentage, level_key=level_key, lms_attempt_id=f"id-{title}")

    def test_student_list_has_one_row_per_student_with_class_and_teacher(self):
        from school_admin.models import Class, Teacher, TeacherClass
        klass = Class.objects.create(school=self.school, class_name="Class 5-A", grade=self.grade, academic_year="2026-2027")
        teacher_user = User.objects.create_user(username="tea", password="x", role=User.Role.TEACHER, full_name="Dhanais")
        TeacherClass.objects.create(teacher=Teacher.objects.create(user=teacher_user, school=self.school), class_obj=klass)
        for i in range(4):  # several attempts must not repeat the student
            self._attempt(f"Lesson {i}", "LESSON", level_key=f"L{i}")
        rows = self.api.get("/api/v1/reports/students/").json()
        self.assertEqual(len(rows), 1)
        self.assertEqual((rows[0]["student_name"], rows[0]["class_name"], rows[0]["teacher_name"]),
                         ("Ravi", "Class 5-A", "Dhanais"))
        self.assertEqual(len(self.api.get(f"/api/v1/reports/students/{self.student.user_id}/").json()["attempts"]), 4)

    def test_class_report_counts_the_students_of_the_class_and_ranks_the_top_one(self):
        from school_admin.models import Class
        klass = Class.objects.create(school=self.school, class_name="Class 5-A", grade=self.grade, academic_year="2026-2027")
        empty = Class.objects.create(school=self.school, class_name="Class 8-A",
                                     grade=Grade.objects.create(grade_name="Class 8", sort_order=8), academic_year="2026-2027")
        second_user = User.objects.create_user(username="ARJ_01", password="x", role=User.Role.STUDENT, full_name="Arj")
        second = Student.objects.create(user=second_user, school=self.school, roll_no="2", grade="Class 5", section="A")
        other_section = User.objects.create_user(username="MAN_01", password="x", role=User.Role.STUDENT, full_name="Mani")
        Student.objects.create(user=other_section, school=self.school, roll_no="1", grade="Class 5", section="D")
        # results that arrived with no class link still count for the student's own class
        self._attempt("L1", "LESSON", score=4, maximum=10, percentage=40, level_key="L1")
        mine = self.student.user
        self.student.user = second_user
        self._attempt("L2", "LESSON", score=9, maximum=10, percentage=90, level_key="L2")
        self.student.user = mine
        rows = {r["class_name"]: r for r in self.api.get("/api/v1/reports/classes/").json()}
        five, eight = rows["Class 5-A"], rows["Class 8-A"]
        self.assertEqual((five["grade_name"], five["section"], five["total_students"]), ("Class 5", "A", 2))
        self.assertEqual((five["top_student"], five["top_student_score"], five["weakest_student"]), ("Arj", 90.0, "Ravi"))
        self.assertEqual((eight["total_students"], eight["top_student"], eight["top_student_score"]), (0, "N/A", None))
        detail = self.api.get(f"/api/v1/reports/classes/{klass.class_id}/").json()
        self.assertEqual([s["student_name"] for s in detail["students"]], ["Arj", "Ravi"])  # also the ones with no attempts

    def test_attempts_carry_their_type_and_a_zero_score_is_kept(self):
        self._attempt("A lesson", "LESSON", level_key="L1")
        self._attempt("An assessment", "ASSESSMENT", score=0, maximum=10, percentage=0, level_key="B1")
        self._attempt("Unlinked boss", "LESSON", level_key="B2", ref="not-an-id")  # the B level key marks an assessment
        data = self.api.get(f"/api/v1/reports/students/{self.student.user_id}/").json()
        types = {a["experience_title"]: a["experience_type"] for a in data["attempts"]}
        self.assertEqual(types, {"A lesson": "LESSON", "An assessment": "ASSESSMENT", "Unlinked boss": "ASSESSMENT"})
        boss = next(a for a in data["attempts"] if a["experience_title"] == "An assessment")
        self.assertEqual((boss["score"], boss["max_score"], boss["percentage"]), (0.0, 10.0, 0.0))
