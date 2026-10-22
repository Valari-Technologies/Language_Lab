import hashlib
import os
import shutil
import tempfile
from datetime import timedelta
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from content_studio.models import Experience, PublishedPackage, PublishVersion
from super_admin.models import Grade, License, LmsServer, School
from teacher.models import Student

User = get_user_model()
HUB_HEADERS = {"HTTP_X_SCHOOL_ID": "SCH-A", "HTTP_X_LICENSE_ID": "LIC-A", "HTTP_X_INSTALLATION_ID": "INST-A1"}


class PackageDownloadTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tmp_dir = tempfile.mkdtemp(prefix="pkg_download_test_")
        self.addCleanup(shutil.rmtree, self.tmp_dir, ignore_errors=True)
        self.author = User.objects.create_user(username="author", password="x", role=User.Role.CONTENT_CREATOR)
        self.grade = Grade.objects.create(grade_name="Grade 3", sort_order=3)
        self.school = School.objects.create(
            schoolId="SCH-A", school_name="School A", address="1 Main St", phone="100", email="a@school.test"
        )
        lic = License.objects.create(
            licenseId="LIC-A", licenseKey="KEY-A", school=self.school,
            expiryDate=timezone.now().date() + timedelta(days=365),
        )
        LmsServer.objects.create(installationId="INST-A1", serverName="Hub", licenseKey="LMS-KEY-A1",
                                 school=self.school, license=lic)
        user = User.objects.create_user(username="AAR_1001", password="x", role=User.Role.STUDENT)
        Student.objects.create(user=user, school=self.school, roll_no="1", grade="Class 3", section="A")

        # Package A has id 500; package B's experience also has id 500 (the live collision).
        self.pkg_a, self.sum_a = self._package(package_id=500, experience_id=900001, title="Package A")
        self.pkg_b, self.sum_b = self._package(package_id=600, experience_id=500, title="Package B")

    def _package(self, package_id, experience_id, title, experience_type="LESSON", content=None):
        exp = Experience.objects.create(
            id=experience_id, title=title, grade=self.grade, subject="English", language="English",
            estimated_duration=10, experience_type=experience_type, status="APPROVED", created_by=self.author,
        )
        pkg = PublishedPackage.objects.create(id=package_id, experience=exp, package_name=title,
                                              compression_status="COMPLETED")
        data = content or f"elab bytes of {title}".encode()
        path = os.path.join(self.tmp_dir, f"pkg{package_id}.elab")
        with open(path, "wb") as f:
            f.write(data)
        checksum = hashlib.sha256(data).hexdigest()
        PublishVersion.objects.create(published_package=pkg, version_number="1.0", build_number=1,
                                      package_size=len(data), checksum=checksum, file_path=path,
                                      published_by=self.author)
        return pkg, checksum

    def _download(self, url):
        response = self.client.get(url)
        body = b"".join(response.streaming_content) if response.status_code == 200 else b""
        return response, body

    def test_package_id_wins_over_experience_id(self):
        response, body = self._download(f"/api/packages/{self.pkg_a.id}/download/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["X-Package-Checksum"], self.sum_a)
        self.assertEqual(hashlib.sha256(body).hexdigest(), self.sum_a)

    def test_download_matches_level_map_for_every_entry(self):
        self._package(package_id=700, experience_id=600, title="Package C")
        self._package(package_id=800, experience_id=700, title="Boss", experience_type="ASSESSMENT")
        level_map = self.client.get("/api/packages/level-map/school/", **HUB_HEADERS).data
        entries = [e for g in level_map["grades"] for e in g["lessons"] + g["bosses"] if e]
        self.assertEqual(len(entries), 4)
        for entry in entries:
            with self.subTest(package=entry["packageId"]):
                response, body = self._download(entry["downloadUrl"])
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response["X-Package-Checksum"], entry["checksum"])
                self.assertEqual(hashlib.sha256(body).hexdigest(), entry["checksum"])

    def test_experience_id_fallback_still_works(self):
        response, body = self._download("/api/packages/900001/download/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["X-Package-Checksum"], self.sum_a)

    def test_version_id_fallback_still_works(self):
        version = PublishVersion.objects.get(published_package=self.pkg_b)
        PublishVersion.objects.filter(pk=version.pk).update(id=987654)
        response, _ = self._download("/api/packages/987654/download/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["X-Package-Checksum"], self.sum_b)

    def test_check_command_reports_bad_checksum(self):
        PublishVersion.objects.filter(published_package=self.pkg_b).update(checksum="0" * 64)
        out = StringIO()
        call_command("check_package_checksums", stdout=out)
        text = out.getvalue()
        self.assertIn("checksum mismatch: 1", text)
        self.assertIn(f"MISMATCH package={self.pkg_b.id}", text)
        self.assertEqual(PublishVersion.objects.get(published_package=self.pkg_b).checksum, "0" * 64)
