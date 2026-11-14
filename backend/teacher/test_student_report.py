import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from assessments.models import ExperienceAssignment, ScreenResponse, StudentAttempt
from content_studio.models import Experience, PublishedPackage, PublishVersion
from lmshub.models import LmsDevice, LmsSession
from school_admin.models import Class, Teacher, TeacherClass
from super_admin.models import Grade, School
from teacher.models import Student

User = get_user_model()


class TeacherStudentReportTests(TestCase):
    """The student report: overview, zones, levels, assessments, progress, activity; scope and missing data."""

    def setUp(self):
        self.api = APIClient()
        self.grade = Grade.objects.create(grade_name="Class 5", sort_order=5)
        self.school = School.objects.create(schoolId="SCH-A", school_name="A", address="1", phone="1", email="a@x.test")
        self.other = School.objects.create(schoolId="SCH-B", school_name="B", address="2", phone="2", email="b@x.test")
        self.author = User.objects.create_user(username="author", password="x", role=User.Role.CONTENT_CREATOR)
        self.teacher = User.objects.create_user(username="teach", password="x", role=User.Role.TEACHER)
        klass = Class.objects.create(school=self.school, class_name="Class 5-A", grade=self.grade, academic_year="2026-2027")
        TeacherClass.objects.create(teacher=Teacher.objects.create(user=self.teacher, school=self.school), class_obj=klass)
        self.api.force_authenticate(self.teacher)
        self.lessons = [self._published(f"Lesson {n}", "LESSON") for n in range(1, 7)]  # levels 1-6
        self.boss = self._published("Zone 1 Test", "ASSESSMENT")  # assessment of zone 1
        self.student = self._student("RAV_01", "ravi kumar", "1")
        self.seq = 0

    def _published(self, title, kind):
        exp = Experience.objects.create(title=title, grade=self.grade, subject="English", language="English",
                                        difficulty="BEGINNER", estimated_duration=10, experience_type=kind,
                                        status="APPROVED", created_by=self.author)
        pkg = PublishedPackage.objects.create(experience=exp, package_name=title, compression_status="COMPLETED")
        PublishVersion.objects.create(published_package=pkg, version_number="1.0", build_number=1, package_size=1,
                                      checksum="c", published_by=self.author)
        return exp

    def _student(self, code, name, roll, school=None, section="A"):
        user = User.objects.create_user(username=code, password="x", role=User.Role.STUDENT, full_name=name)
        return Student.objects.create(user=user, school=school or self.school, roll_no=roll, grade="Class 5", section=section)

    def _attempt(self, exp, level_key, percentage=None, when=None, seconds=60, status="COMPLETED", score=None, maximum=None):
        self.seq += 1
        assignment, _ = ExperienceAssignment.objects.get_or_create(
            school=self.school, experience_ref=str(exp.id), defaults={"experience_title": exp.title, "assigned_at": timezone.now()})
        when = when or timezone.now()
        return StudentAttempt.objects.create(
            assignment=assignment, student=self.student.user, school=self.school, started_at=when, completed_at=when,
            status=status, percentage=percentage, total_score=score, max_score=maximum, level_key=level_key,
            time_spent_seconds=seconds, lms_attempt_id=f"a-{self.seq}")

    def _report(self, student=None):
        res = self.api.get(f"/api/cms/v1/teacher/reports/students/{(student or self.student).student_id}/report/")
        self.assertEqual(res.status_code, 200, res.content)
        return res.json()

    def test_overview_zones_and_levels(self):
        now = timezone.now()
        self._attempt(self.lessons[0], "L1", percentage=40, when=now - timedelta(days=2), seconds=100)
        self._attempt(self.lessons[0], "L1", percentage=70, when=now - timedelta(days=1), seconds=200)  # a retry
        self._attempt(self.lessons[1], "L2", when=now, seconds=300)
        self._attempt(self.lessons[2], "L3", when=now - timedelta(days=40), seconds=60)  # long ago
        self._attempt(self.lessons[3], "L4", status="IN_PROGRESS", seconds=30)
        data = self._report()
        rows = data["attempts"]  # one row per attempt, oldest first, with when it started and ended
        self.assertEqual(len(rows), 5)
        self.assertEqual([r["title"] for r in rows], ["Lesson 3", "Lesson 1", "Lesson 1", "Lesson 2", "Lesson 4"])
        self.assertTrue(all(r["kind"] == "lesson" for r in rows))
        unfinished = next(r for r in rows if r["status"] == "IN_PROGRESS")
        self.assertIsNotNone(unfinished["startedAt"])
        self.assertEqual(rows[1]["percentage"], 40.0)
        o = data["overview"]
        self.assertEqual((o["name"], o["rollNo"], o["loginCode"]), ("Ravi Kumar", "1", "RAV_01"))
        self.assertEqual((o["levelsCompleted"], o["levelsTotal"], o["progress"], o["zonesCompleted"], o["zonesTotal"]), (3, 6, 50, 0, 6))
        self.assertEqual((o["gamesPlayed"], o["gamesCompleted"], o["attempts"]), (4, 3, 5))
        self.assertEqual((o["learningSeconds"], o["avgSecondsPerGame"]), (690, 172))  # 690 / 4 games
        self.assertEqual((o["avgAssessment"], o["performance"]), (None, "not_assessed"))

        level_one = data["levels"][0]
        self.assertEqual((level_one["title"], level_one["status"], level_one["attempts"]), ("Lesson 1", "completed", 2))
        self.assertEqual((level_one["score"], level_one["bestScore"], level_one["previousScore"]), (70.0, 70.0, 40.0))
        self.assertEqual(len(level_one["attemptList"]), 2)
        self.assertIsNone(data["levels"][1]["score"])  # a lesson without a score is not shown as 0
        self.assertEqual(data["levels"][3]["status"], "in_progress")
        self.assertEqual(data["levels"][4]["status"], "not_started")
        self.assertEqual(data["levels"][6]["status"], "not_published")  # level 7 has no lesson yet
        first, second, third = data["zones"][0], data["zones"][1], data["zones"][2]
        self.assertEqual((first["name"], first["levelsCompleted"], first["levelsPublished"], first["progress"]), ("Summer Zone", 3, 5, 60))
        self.assertEqual((first["gamesPlayed"], first["gamesCompleted"], first["attempts"], first["seconds"]), (4, 3, 5, 690))
        self.assertFalse(first["complete"])
        self.assertEqual((second["name"], second["levelsPublished"], second["progress"]), ("Winter Zone", 1, 0))
        self.assertEqual((third["levelsPublished"], third["progress"]), (0, None))
        self.assertEqual(len(data["zones"]), 6)
        # finishing the last two levels of zone 1 completes it and records the date
        self._attempt(self.lessons[3], "L4", when=now)
        self._attempt(self.lessons[4], "L5", when=now)
        first = self._report()["zones"][0]
        self.assertEqual((first["complete"], first["progress"]), (True, 100))
        self.assertIsNotNone(first["completedAt"])

    def test_assessment_marks_answers_and_improvement(self):
        now = timezone.now()
        self._attempt(self.boss, "B1", percentage=40, score=4, maximum=10, when=now - timedelta(days=3))
        latest = self._attempt(self.boss, "B1", percentage=80, score=8, maximum=10, when=now)
        for i in range(5):
            ScreenResponse.objects.create(attempt=latest, school=self.school, screen_ref=str(i), screen_title=f"Question {i + 1}",
                                          screen_type="quiz", response_data={"picked": "B"}, score=2 if i else 0, max_score=2,
                                          is_correct=bool(i))
        data = self._report()
        a = data["assessments"][0]
        self.assertEqual((a["name"], a["zone"], a["zoneName"], a["status"], a["attempts"]), ("Zone 1 Test", 1, "Summer Zone", "completed", 2))
        self.assertEqual((a["totalQuestions"], a["correct"], a["incorrect"], a["unanswered"]), (5, 4, 1, None))
        self.assertEqual((a["totalMarks"], a["marksObtained"], a["percentage"], a["result"], a["passMark"]), (10.0, 8.0, 80.0, "pass", 70))
        self.assertEqual((a["highestScore"], a["latestScore"]), (80.0, 80.0))
        self.assertEqual([x["screen"] for x in a["answers"]], [f"Question {i}" for i in range(1, 6)])
        self.assertEqual(a["answers"][1]["details"], {"picked": "B"})
        self.assertEqual(data["overview"]["avgAssessment"], 60.0)  # (40 + 80) / 2
        self.assertEqual((data["overview"]["assessmentsCompleted"], data["overview"]["performance"]), (1, "average"))
        self.assertEqual([t["percentage"] for t in data["progress"]["timeline"]], [40.0, 80.0])
        self.assertEqual(data["progress"]["improvement"], [{"name": "Zone 1 Test", "firstScore": 40.0, "latestScore": 80.0, "change": 40.0}])
        self.assertEqual(data["progress"]["zoneComparison"][0]["assessmentScore"], 80.0)
        self.assertEqual(data["zones"][0]["assessmentScore"], 80.0)

    def test_assessment_without_answers_or_not_taken(self):
        data = self._report()
        a = data["assessments"][0]
        self.assertEqual((a["status"], a["attempts"], a["percentage"], a["result"], a["totalQuestions"]), ("not_started", 0, None, None, None))
        self._attempt(self.boss, "B1", percentage=40, score=4, maximum=10)
        a = self._report()["assessments"][0]
        self.assertEqual((a["result"], a["correct"], a["incorrect"], a["totalQuestions"], a["answers"]), ("fail", None, None, None, []))

    def test_activity_history_sessions_and_periods(self):
        now = timezone.now()
        noon = now.replace(hour=12, minute=0, second=0, microsecond=0)  # one fixed day, so the test never crosses midnight
        device = LmsDevice.objects.create(school=self.school, pc_id=uuid.uuid4(), pc_name="PC1", token_hash="d" * 64, paired_at=now)
        LmsSession.objects.create(token_hash="a" * 64, student=self.student, device=device, created_at=noon - timedelta(hours=2),
                                  last_heartbeat=noon - timedelta(hours=1), ended_at=noon - timedelta(hours=1), end_reason="logout")
        self._attempt(self.lessons[0], "L1", when=noon - timedelta(minutes=90), seconds=120)
        self._attempt(self.lessons[1], "L2", when=noon - timedelta(days=20), seconds=60)
        self._attempt(self.lessons[2], "L3", when=noon - timedelta(days=80), seconds=60)  # older than the 60 days of history
        data = self._report()
        today = data["history"][0]
        self.assertEqual((today["date"], today["sessions"], today["seconds"], len(today["items"])),
                         (noon.date().isoformat(), 1, 120, 1))
        self.assertEqual(today["items"][0]["title"], "Lesson 1")
        self.assertEqual(len(data["history"]), 2)  # today and 20 days ago, not 80
        self.assertEqual(len(data["sessions"]), 1)
        self.assertEqual((data["sessions"][0]["endReason"], data["sessions"][0]["seconds"]), ("logout", 3600))
        self.assertIsNotNone(data["overview"]["lastLogin"])
        week, month = data["progress"]["periods"]["7"], data["progress"]["periods"]["30"]
        self.assertEqual((week["levelsCompleted"], week["attempts"], week["learningSeconds"]), (1, 1, 120))
        self.assertEqual((month["levelsCompleted"], month["attempts"], month["learningSeconds"]), (2, 2, 180))
        self.assertEqual(data["overview"]["activity"], "active")

    def test_scope_and_roles(self):
        other_section = self._student("MAN_01", "mani", "1", section="B")
        foreign = self._student("LEE_01", "lee", "1", school=self.other)
        for student in (other_section, foreign):
            res = self.api.get(f"/api/cms/v1/teacher/reports/students/{student.student_id}/report/")
            self.assertEqual(res.status_code, 404)
        self.assertEqual(self.api.get("/api/cms/v1/teacher/reports/students/999999/report/").status_code, 404)
        for user in (self.student.user, User.objects.create_user(username="adm", password="x", role=User.Role.SCHOOL_ADMIN)):
            self.api.force_authenticate(user)
            self.assertEqual(self.api.get(f"/api/cms/v1/teacher/reports/students/{self.student.student_id}/report/").status_code, 403)
        self.api.force_authenticate(None)
        self.assertIn(self.api.get(f"/api/cms/v1/teacher/reports/students/{self.student.student_id}/report/").status_code, (401, 403))
