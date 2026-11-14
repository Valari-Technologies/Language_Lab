import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.test import APIClient

from assessments.models import StudentAttempt
from content_studio.models import Experience, PublishedPackage, PublishVersion
from school_admin.models import Class, Teacher, TeacherClass
from super_admin.models import Grade, License, LmsServer, School, SchoolAdminProfile
from teacher.models import Student

User = get_user_model()
URL = "/api/hub/progress/"
HUB_HEADERS = {"HTTP_X_SCHOOL_ID": "SCH-A", "HTTP_X_LICENSE_ID": "LIC-A", "HTTP_X_INSTALLATION_ID": "INST-A1"}


class HubProgressAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.grade3 = Grade.objects.create(grade_name="Grade 3", sort_order=3)
        self.school_a = School.objects.create(
            schoolId="SCH-A", school_name="School A", address="1 Main St", phone="100", email="a@school.test"
        )
        self.school_b = School.objects.create(
            schoolId="SCH-B", school_name="School B", address="2 Main St", phone="200", email="b@school.test"
        )
        lic = License.objects.create(
            licenseId="LIC-A", licenseKey="KEY-A", school=self.school_a,
            expiryDate=timezone.now().date() + timedelta(days=365),
        )
        LmsServer.objects.create(
            installationId="INST-A1", serverName="Hub A", licenseKey="LMS-KEY-A1",
            school=self.school_a, license=lic,
        )
        self.class_3a = Class.objects.create(
            school=self.school_a, class_name="Class 3-A", grade=self.grade3, academic_year="2026-2027"
        )

        self.teacher_user = User.objects.create_user(username="teach_a", password="x", role=User.Role.TEACHER)
        teacher = Teacher.objects.create(user=self.teacher_user, school=self.school_a)
        TeacherClass.objects.create(teacher=teacher, class_obj=self.class_3a)
        self.admin_user = User.objects.create_user(username="admin_a", password="x", role=User.Role.SCHOOL_ADMIN)
        SchoolAdminProfile.objects.create(user=self.admin_user, school=self.school_a)

        self.s_matched = self._student("AAR_1001", self.school_a, "Class 3", "A")
        self.s_no_class = self._student("DIY_1002", self.school_a, "Class 3", "B")
        self.s_other = self._student("OTH_0001", self.school_b, "Class 3", "A")

        author = User.objects.create_user(username="author", password="x", role=User.Role.CONTENT_CREATOR)
        self.exp = Experience.objects.create(
            title="Lesson 1", grade=self.grade3, subject="English", language="English",
            estimated_duration=10, status="APPROVED", created_by=author,
        )
        self.pkg = PublishedPackage.objects.create(experience=self.exp, package_name="Lesson 1", compression_status="COMPLETED")
        PublishVersion.objects.create(published_package=self.pkg, version_number="1.0", build_number=1, package_size=10)

    def _student(self, username, school, grade, section):
        user = User.objects.create_user(username=username, password=username, role=User.Role.STUDENT)
        return Student.objects.create(
            user=user, school=school, roll_no="1", grade=grade, section=section, academic_year="2026-2027"
        )

    def _event(self, student, **overrides):
        event = {
            "event_id": str(uuid.uuid4()),
            "student_id": student.student_id,
            "login_code": student.user.username,
            "level_key": "L1",
            "package_id": self.pkg.id,
            "experience_id": self.exp.id,
            "stars": 3,
            "score": 80,
            "max_score": 100,
            "completed": True,
            "completed_at": timezone.now().isoformat(),
            "screens": [{"screen_id": "s1", "screen_title": "Q1", "screen_type": "QUIZ", "score": 1, "max_score": 1, "is_correct": True}],
        }
        event.update(overrides)
        return event

    def _post(self, events):
        return self.client.post(URL, {"events": events}, format="json", **HUB_HEADERS)

    def test_unregistered_hub_forbidden(self):
        response = self.client.post(URL, {"events": []}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data, {"error": "hub_not_registered"})
        self.assertEqual(self.client.get(URL).status_code, status.HTTP_403_FORBIDDEN)

    def test_saves_stars_level_key_and_class(self):
        event = self._event(self.s_matched)
        response = self._post([event])
        self.assertEqual(response.data, {"accepted": [event["event_id"]], "duplicates": [], "rejected": [], "no_class": []})
        attempt = StudentAttempt.objects.get(lms_attempt_id=event["event_id"])
        self.assertEqual((attempt.stars, attempt.level_key, attempt.status), (3, "L1", "COMPLETED"))
        self.assertEqual(float(attempt.percentage), 80.0)
        self.assertEqual(attempt.assignment.class_obj, self.class_3a)
        self.assertEqual(attempt.screen_responses.count(), 1)

    def test_max_score_used_for_percentage(self):
        out_of_20 = self._event(self.s_matched, score=15, max_score=20)
        zero_max = self._event(self.s_matched, score=0, max_score=0)
        default_max = self._event(self.s_matched, score=40, max_score=None)
        response = self._post([out_of_20, zero_max, default_max]).data
        self.assertEqual(response["accepted"], [out_of_20["event_id"], default_max["event_id"]])
        self.assertEqual(response["rejected"][0]["event_id"], zero_max["event_id"])
        self.assertIn("max_score", response["rejected"][0]["error"])
        self.assertEqual(float(StudentAttempt.objects.get(lms_attempt_id=out_of_20["event_id"]).percentage), 75.0)
        default_attempt = StudentAttempt.objects.get(lms_attempt_id=default_max["event_id"])
        self.assertEqual((float(default_attempt.max_score), float(default_attempt.percentage)), (100.0, 40.0))

    def test_duplicate_event(self):
        event = self._event(self.s_matched)
        self._post([event])
        response = self._post([event, event])
        self.assertEqual(response.data["accepted"], [])
        self.assertEqual(response.data["duplicates"], [event["event_id"], event["event_id"]])
        self.assertEqual(StudentAttempt.objects.filter(lms_attempt_id=event["event_id"]).count(), 1)

    def test_other_schools_student_rejected(self):
        response = self._post([self._event(self.s_other)])
        self.assertEqual(response.data["rejected"][0]["error"], "student_not_found")
        self.assertFalse(StudentAttempt.objects.exists())

    def test_wrong_login_code_for_student_id_rejected(self):
        response = self._post([self._event(self.s_matched, login_code="DIY_1002")])
        self.assertEqual(response.data["rejected"][0]["error"], "login_code_mismatch")

    def test_unmatched_class_saved_without_class(self):
        event = self._event(self.s_no_class)
        response = self._post([event])
        self.assertEqual(response.data["accepted"], [event["event_id"]])
        self.assertEqual(response.data["no_class"], ["DIY_1002"])
        self.assertIsNone(StudentAttempt.objects.get(lms_attempt_id=event["event_id"]).assignment.class_obj)

    def test_invalid_stars_and_level_key_rejected(self):
        response = self._post([self._event(self.s_matched, stars=6), self._event(self.s_matched, level_key="L31")])
        self.assertEqual(len(response.data["rejected"]), 2)
        self.assertIn("stars", response.data["rejected"][0]["error"])
        self.assertIn("level_key", response.data["rejected"][1]["error"])

    def test_batch_over_500_rejected(self):
        response = self._post([self._event(self.s_matched) for _ in range(501)])
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "batch_too_large")
        self.assertFalse(StudentAttempt.objects.exists())

    def test_get_since_and_cursor_paging(self):
        before = timezone.now() - timedelta(seconds=1)
        events = [self._event(self.s_matched) for _ in range(3)]
        ids = [e["event_id"] for e in events]
        self._post(events)

        page1 = self.client.get(URL, {"since": before.isoformat(), "limit": 2}, **HUB_HEADERS).data
        self.assertEqual(len(page1["attempts"]), 2)
        self.assertIsNotNone(page1["next"])
        self.assertEqual(page1["overlap_seconds"], 300)
        page2 = self.client.get(URL, {"since": before.isoformat(), "limit": 2, "cursor": page1["next"]}, **HUB_HEADERS).data
        self.assertEqual(len(page2["attempts"]), 1)
        self.assertIsNone(page2["next"])
        got = [a["event_id"] for a in page1["attempts"] + page2["attempts"]]
        self.assertEqual(sorted(got), sorted(ids))
        first = page1["attempts"][0]
        self.assertEqual(first["login_code"], "AAR_1001")
        self.assertEqual(first["student_id"], self.s_matched.student_id)
        self.assertEqual((first["experience_id"], first["package_id"]), (self.exp.id, self.pkg.id))
        self.assertEqual((first["stars"], first["level_key"], first["completed"]), (3, "L1", True))

        later = self.client.get(URL, {"since": page2["server_time"]}, **HUB_HEADERS).data
        self.assertEqual(later["attempts"], [])

    def test_overlap_rereads_late_committed_row(self):
        self._post([self._event(self.s_matched)])
        call1 = self.client.get(URL, **HUB_HEADERS).data
        since1 = parse_datetime(call1["server_time"])

        # A row that commits after call1 but carries a synced_at just before call1's server_time.
        late = self._event(self.s_matched)
        self._post([late])
        StudentAttempt.objects.filter(lms_attempt_id=late["event_id"]).update(synced_at=since1 - timedelta(seconds=10))

        naive = self.client.get(URL, {"since": since1.isoformat()}, **HUB_HEADERS).data
        self.assertNotIn(late["event_id"], [a["event_id"] for a in naive["attempts"]])

        overlap_since = since1 - timedelta(seconds=call1["overlap_seconds"])
        reread = self.client.get(URL, {"since": overlap_since.isoformat()}, **HUB_HEADERS).data
        self.assertIn(late["event_id"], [a["event_id"] for a in reread["attempts"]])

    def test_reports_show_hub_attempts_when_class_matched(self):
        self._post([self._event(self.s_matched)])

        self.client.force_authenticate(self.admin_user)
        overview = self.client.get("/api/v1/reports/overview/").data
        self.assertEqual((overview["total_attempts"], overview["total_completed"]), (1, 1))
        classes = self.client.get("/api/v1/reports/classes/").data
        row = next(c for c in classes if c["class_id"] == self.class_3a.class_id)
        self.assertEqual((row["total_students"], row["completed"]), (1, 1))
        teachers = self.client.get("/api/v1/reports/teachers/").data
        self.assertEqual(teachers[0]["total_students"], 1)
        self.assertEqual(teachers[0]["average_class_score"], 80.0)

        self.client.force_authenticate(self.teacher_user)
        teacher_overview = self.client.get("/api/v1/reports/overview/").data
        self.assertEqual(teacher_overview["total_attempts"], 1)
