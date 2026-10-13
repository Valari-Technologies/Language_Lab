import hashlib
import os
import shutil
import tempfile
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from super_admin.models import Grade, School
from teacher.models import Student
from content_studio.models import Experience, PublishedPackage, PublishVersion

User = get_user_model()
URL = "/api/packages/level-map/"


class LevelMapAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.author = User.objects.create_user(
            username="level_map_author", password="Password123!", role=User.Role.CONTENT_CREATOR
        )
        self.grade5 = Grade.objects.create(grade_name="Class 5", sort_order=5)
        self.grade6 = Grade.objects.create(grade_name="Class 6", sort_order=6)
        self.school_a = School.objects.create(
            schoolId="SCH-A", school_name="School A", address="1 Main St", phone="100", email="a@school.test"
        )
        self.school_b = School.objects.create(
            schoolId="SCH-B", school_name="School B", address="2 Main St", phone="200", email="b@school.test"
        )
        self.student = self._make_student("DHA_12", self.school_a, "Class 5", roll_no="12")
        self.base_time = timezone.now() - timedelta(days=30)
        self._minutes = 0
        self.tmp_dir = tempfile.mkdtemp(prefix="level_map_test_")
        self.addCleanup(shutil.rmtree, self.tmp_dir, ignore_errors=True)

    def _make_student(self, username, school, grade, roll_no="1"):
        user = User.objects.create_user(
            username=username, password=username, role=User.Role.STUDENT, full_name=username
        )
        return Student.objects.create(user=user, school=school, roll_no=roll_no, grade=grade)

    def _make_package(self, title, grade=None, experience_type="LESSON", minutes=None,
                      status_value="APPROVED", compression="COMPLETED", deleted=False):
        if minutes is None:
            self._minutes += 1
            minutes = self._minutes
        exp = Experience.objects.create(
            title=title,
            grade=grade or self.grade5,
            subject="English",
            language="English",
            estimated_duration=10,
            experience_type=experience_type,
            status=status_value,
            created_by=self.author,
            is_deleted=deleted,
        )
        Experience.objects.filter(pk=exp.pk).update(created_at=self.base_time + timedelta(minutes=minutes))
        pkg = PublishedPackage.objects.create(experience=exp, package_name=title, compression_status=compression)
        PublishVersion.objects.create(
            published_package=pkg, version_number="1.0", build_number=1,
            package_size=2048, checksum="abc123", published_by=self.author,
        )
        return pkg

    def _add_version_with_file(self, pkg, version_number, content):
        """Write a real .elab file and record a PublishVersion pointing at it with its SHA-256."""
        file_path = os.path.join(self.tmp_dir, f"pkg{pkg.id}_v{version_number}.elab")
        with open(file_path, "wb") as f:
            f.write(content)
        return PublishVersion.objects.create(
            published_package=pkg, version_number=version_number, build_number=2,
            package_size=len(content), checksum=hashlib.sha256(content).hexdigest(),
            published_by=self.author, file_path=file_path,
        )

    def _download(self, download_url):
        # Consuming streaming_content lets the test client close the file itself;
        # calling response.close() again would close the test DB connection.
        response = self.client.get(download_url)
        body = b"".join(response.streaming_content) if response.status_code == 200 else b""
        return response, body

    def _get(self, login_code="DHA_12", school_id="SCH-A"):
        return self.client.get(URL, {"login_code": login_code, "school_id": school_id})

    def test_returns_only_students_grade(self):
        own = self._make_package("Grade 5 lesson")
        self._make_package("Grade 6 lesson", grade=self.grade6)
        response = self._get()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["grade"], {"id": self.grade5.id, "name": "Class 5", "number": 5})
        self.assertEqual(response.data["student"]["login_code"], "DHA_12")
        self.assertEqual(response.data["counts"], {"lessons": 1, "assessments": 0})
        self.assertEqual(response.data["lessons"][0]["packageId"], str(own.id))

    def test_excludes_unapproved_unbuilt_and_deleted(self):
        self._make_package("Draft", status_value="DRAFT")
        self._make_package("Pending", status_value="PENDING_APPROVAL")
        self._make_package("Not built", compression="PENDING")
        self._make_package("Deleted", deleted=True)
        response = self._get()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["counts"], {"lessons": 0, "assessments": 0})

    def test_null_is_deleted_lesson_appears_and_downloads(self):
        pkg = self._make_package("Legacy lesson")
        Experience.objects.filter(pk=pkg.experience_id).update(is_deleted=None)
        content = b"legacy elab bytes"
        self._add_version_with_file(pkg, "1.1", content)

        response = self._get()
        self.assertEqual(response.data["counts"], {"lessons": 1, "assessments": 0})
        entry = response.data["lessons"][0]
        self.assertEqual(entry["packageId"], str(pkg.id))

        download, body = self._download(entry["downloadUrl"])
        self.assertEqual(download.status_code, status.HTTP_200_OK)
        self.assertEqual(body, content)

    def test_map_checksum_matches_download_header(self):
        pkg = self._make_package("Checked lesson")
        content = b"current elab bytes"
        self._add_version_with_file(pkg, "1.1", content)

        entry = self._get().data["lessons"][0]
        download, body = self._download(entry["downloadUrl"])
        self.assertEqual(download.status_code, status.HTTP_200_OK)
        self.assertEqual(download["X-Package-Checksum"], entry["checksum"])
        self.assertEqual(download["X-Package-Version"], entry["version"])
        self.assertEqual(hashlib.sha256(body).hexdigest(), entry["checksum"])

    def test_student_from_other_school_not_found(self):
        self._make_student("RAV_03", self.school_b, "Class 5", roll_no="3")
        response = self._get(login_code="RAV_03", school_id="SCH-A")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data, {"error": "student_not_found"})

    def test_login_code_case_insensitive_and_roll_no_ignored(self):
        self.assertEqual(self._get(login_code="dha_12").status_code, status.HTTP_200_OK)
        response = self._get(login_code="12")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data, {"error": "student_not_found"})

    def test_school_lookup(self):
        self.assertEqual(self.client.get(URL, {"login_code": "DHA_12"}).status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self._get(school_id="NOPE").status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self._get(school_id=str(self.school_a.school_id)).status_code, status.HTTP_200_OK)

    def test_ordering_oldest_first(self):
        self._make_package("Newest", minutes=300)
        self._make_package("Oldest", minutes=100)
        self._make_package("Middle", minutes=200)
        self._make_package("Boss late", experience_type="ASSESSMENT", minutes=50)
        self._make_package("Boss early", experience_type="ASSESSMENT", minutes=10)
        response = self._get()
        self.assertEqual([e["title"] for e in response.data["lessons"][:3]], ["Oldest", "Middle", "Newest"])
        self.assertEqual([e["title"] for e in response.data["bosses"][:2]], ["Boss early", "Boss late"])

    def test_limits_30_lessons_and_6_bosses(self):
        for i in range(32):
            self._make_package(f"Lesson {i + 1:02d}")
        for i in range(7):
            self._make_package(f"Boss {i + 1}", experience_type="ASSESSMENT")
        response = self._get()
        lessons, bosses = response.data["lessons"], response.data["bosses"]
        self.assertEqual(response.data["counts"], {"lessons": 30, "assessments": 6})
        self.assertEqual(len(lessons), 30)
        self.assertEqual(len(bosses), 6)
        self.assertEqual(lessons[0]["title"], "Lesson 01")
        self.assertEqual(lessons[29]["title"], "Lesson 30")
        self.assertEqual(bosses[5]["title"], "Boss 6")
        self.assertEqual([lessons[i]["zone"] for i in (0, 4, 5, 29)], [1, 1, 2, 6])
        self.assertEqual(lessons[29]["slot"], 30)
        self.assertEqual([(b["slot"], b["zone"]) for b in bosses], [(i, i) for i in range(1, 7)])

    def test_empty_slots_are_null(self):
        first = self._make_package("First lesson")
        self._make_package("Second lesson")
        self._make_package("Only boss", experience_type="ASSESSMENT")
        response = self._get()
        lessons, bosses = response.data["lessons"], response.data["bosses"]
        self.assertEqual(response.data["counts"], {"lessons": 2, "assessments": 1})
        self.assertEqual(len(lessons), 30)
        self.assertEqual(len(bosses), 6)
        self.assertTrue(all(entry is None for entry in lessons[2:]))
        self.assertTrue(all(entry is None for entry in bosses[1:]))
        entry = lessons[0]
        self.assertEqual(entry["experienceId"], first.experience_id)
        self.assertEqual(entry["type"], "LESSON")
        self.assertEqual(entry["version"], "1.0")
        self.assertEqual(entry["checksum"], "abc123")
        self.assertEqual(entry["packageSize"], 2048)
        self.assertEqual(entry["downloadUrl"], f"/api/packages/{first.id}/download/")
        self.assertEqual(bosses[0]["type"], "ASSESSMENT")

    def test_uses_latest_version(self):
        pkg = self._make_package("Versioned")
        PublishVersion.objects.create(
            published_package=pkg, version_number="1.1", build_number=2,
            package_size=4096, checksum="def456", published_by=self.author,
        )
        entry = self._get().data["lessons"][0]
        self.assertEqual((entry["version"], entry["checksum"], entry["packageSize"]), ("1.1", "def456", 4096))

    def test_grade_text_variants_resolve(self):
        for raw in ["Class 5", "5", "Grade 5", " class 5 "]:
            with self.subTest(raw=raw):
                Student.objects.filter(pk=self.student.pk).update(grade=raw)
                response = self._get()
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.data["grade"]["id"], self.grade5.id)

    def test_unknown_grade_returns_422(self):
        Student.objects.filter(pk=self.student.pk).update(grade="Class 9")
        response = self._get()
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertEqual(response.data, {"error": "grade_not_found", "raw": "Class 9"})
