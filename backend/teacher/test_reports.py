import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from assessments.models import ExperienceAssignment, StudentAttempt
from lmshub.models import LmsDevice, LmsSession
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
        self.assertEqual(row["rollNo"], "1")
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

    def _day_url(self, student, start, end):
        return f"{URL}students/{student.student_id}/day/?start={start.isoformat()}&end={end.isoformat()}".replace("+", "%2B")

    def test_student_day_report(self):
        day = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        end = day + timedelta(days=1)
        device = LmsDevice.objects.create(school=self.school, pc_id=uuid.uuid4(), pc_name="PC1", token_hash="d" * 64, paired_at=day)
        LmsSession.objects.create(token_hash="a" * 64, student=self.s_a, device=device, created_at=day + timedelta(hours=9),
                                  last_heartbeat=day + timedelta(hours=9, minutes=40), ended_at=day + timedelta(hours=9, minutes=45),
                                  end_reason="logout")
        LmsSession.objects.create(token_hash="b" * 64, student=self.s_a, device=device, created_at=day + timedelta(hours=14),
                                  last_heartbeat=day + timedelta(hours=14, minutes=30), ended_at=day + timedelta(hours=14, minutes=31),
                                  end_reason="expired")
        done = self._attempt(self.s_a, "1", 80, 2, "L1")
        done.completed_at = day + timedelta(hours=9, minutes=20)
        done.time_spent_seconds = 600
        done.save()
        same_lesson = self._attempt(self.s_a, "1", 90, 3, "L1")
        same_lesson.completed_at = day + timedelta(hours=14, minutes=10)
        same_lesson.time_spent_seconds = None
        same_lesson.started_at = day + timedelta(hours=14, minutes=5)
        same_lesson.save()
        yesterday = self._attempt(self.s_a, "2", 70, 2, "L2")
        yesterday.completed_at = day - timedelta(hours=3)
        yesterday.save()
        self.api.force_authenticate(self.teacher)
        data = self.api.get(self._day_url(self.s_a, day, end)).json()
        self.assertEqual((data["completedLessons"], data["lessonSeconds"]), (1, 600 + 300))
        self.assertEqual(data["loginAt"], (day + timedelta(hours=9)).isoformat())
        self.assertEqual(data["logoutAt"], (day + timedelta(hours=14, minutes=31)).isoformat())
        self.assertEqual((data["onlineSeconds"], data["sessions"], data["stillOnline"]), (45 * 60 + 31 * 60, 2, False))

    def test_student_day_remaining_lessons_and_assessment_marks(self):
        from content_studio.models import Experience, PublishedPackage, PublishVersion

        def package(title, kind):
            exp = Experience.objects.create(title=title, grade=self.grade3, subject="English", language="English",
                                            estimated_duration=10, experience_type=kind, status="APPROVED", created_by=self.teacher)
            pkg = PublishedPackage.objects.create(experience=exp, package_name=title, compression_status="COMPLETED")
            PublishVersion.objects.create(published_package=pkg, version_number="1.0", build_number=1, package_size=1,
                                          checksum="c", published_by=self.teacher)
            return exp

        one, two, three = package("L-one", "LESSON"), package("L-two", "LESSON"), package("L-three", "LESSON")
        boss = package("Boss", "ASSESSMENT")
        day = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        end = day + timedelta(days=1)

        def finish(exp, when, level_key, score=None, maximum=None, percentage=None):
            attempt = self._attempt(self.s_a, str(exp.id), percentage or 100, 2, level_key)
            attempt.completed_at, attempt.started_at, attempt.time_spent_seconds = when, when - timedelta(minutes=2), 120
            attempt.total_score, attempt.max_score = score, maximum
            attempt.save()
            ExperienceAssignment.objects.filter(school=self.school, experience_ref=str(exp.id)).update(experience_title=exp.title)

        finish(one, day + timedelta(hours=10), "L1")
        finish(two, day - timedelta(days=1, hours=-10), "L2")  # an earlier day: still counted as done, not in today's total
        finish(boss, day + timedelta(hours=11), "B1", score=8, maximum=10, percentage=80)
        self.api.force_authenticate(self.teacher)
        data = self.api.get(self._day_url(self.s_a, day, end)).json()
        self.assertEqual((data["completedLessons"], data["lessonSeconds"]), (1, 120))  # the assessment is not a lesson
        self.assertEqual((data["remainingLessons"], data["totalLessons"], data["remainingTitles"]), (1, 3, ["L-three"]))
        self.assertEqual([(a["title"], a["score"], a["maxScore"], a["percentage"]) for a in data["assessments"]],
                         [("Boss", 8.0, 10.0, 80.0)])

    def test_student_day_report_rules(self):
        day = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        end = day + timedelta(days=1)
        self.api.force_authenticate(self.teacher)
        empty = self.api.get(self._day_url(self.s_a, day, end)).json()
        self.assertEqual((empty["completedLessons"], empty["lessonSeconds"], empty["loginAt"], empty["logoutAt"]), (0, 0, None, None))
        self.assertEqual(self.api.get(self._day_url(self.s_g4, day, end)).status_code, 404)  # not the teacher's grade
        self.assertEqual(self.api.get(self._day_url(self.s_other, day, end)).status_code, 404)  # other school
        self.assertEqual(self.api.get(f"{URL}students/{self.s_a.student_id}/day/").status_code, 400)
        self.assertEqual(self.api.get(self._day_url(self.s_a, day, day + timedelta(days=9))).status_code, 400)
        self.api.force_authenticate(self.s_a.user)
        self.assertEqual(self.api.get(self._day_url(self.s_a, day, end)).status_code, 403)

    def test_only_teachers(self):
        admin = User.objects.create_user(username="adm", password="x", role=User.Role.SCHOOL_ADMIN)
        for user in (admin, self.s_a.user):
            self.api.force_authenticate(user)
            self.assertEqual(self.api.get(URL).status_code, 403)
        self.api.force_authenticate(None)
        self.assertIn(self.api.get(URL).status_code, (401, 403))
