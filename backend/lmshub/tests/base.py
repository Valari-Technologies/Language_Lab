import hashlib
import json
import os
import shutil
import tempfile
import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.utils import timezone

from content_studio.models import Experience, PublishedPackage, PublishVersion
from lmshub.core import current_pairing_code
from school_admin.models import Class
from super_admin.models import Grade, License, School
from teacher.models import Student

User = get_user_model()
BASE = "/api/lms-hub"


class HubTestBase(TestCase):
    """Two schools; school A has grade-3 students, class 3-A, two lessons and a boss with real files."""

    def setUp(self):
        self.client = Client()
        self.tmp_dir = tempfile.mkdtemp(prefix="lmshub_test_")
        self.addCleanup(shutil.rmtree, self.tmp_dir, ignore_errors=True)
        self.author = User.objects.create_user(username="author", password="x", role=User.Role.CONTENT_CREATOR)
        self.grade3 = Grade.objects.create(grade_name="Grade 3", sort_order=3)
        self.grade4 = Grade.objects.create(grade_name="Grade 4", sort_order=4)
        future = timezone.now().date() + timedelta(days=365)
        self.school_a = School.objects.create(schoolId="SCH-A", school_code="TIM_004", school_name="Time",
                                              address="1 Main St", phone="100", email="a@school.test")
        self.school_b = School.objects.create(schoolId="SCH-B", school_code="OTH_001", school_name="Other",
                                              address="2 Main St", phone="200", email="b@school.test")
        self.license_a = License.objects.create(licenseId="LIC-A", licenseKey="KEY-A", school=self.school_a,
                                                expiryDate=future, concurrentUsersPerServer=2)
        self.license_b = License.objects.create(licenseId="LIC-B", licenseKey="KEY-B", school=self.school_b,
                                                expiryDate=future, concurrentUsersPerServer=40)
        self.class_3a = Class.objects.create(school=self.school_a, class_name="Class 3-A", grade=self.grade3,
                                             academic_year="2026-2027")

        self.s1 = self._student("AAR_1001", self.school_a, "Class 3", "A")
        self.s2 = self._student("DIY_1002", self.school_a, "Class 3", "B")   # no class 3-B
        self.s3 = self._student("KAB_8001", self.school_a, "Class 3", "A")
        self.s4 = self._student("ANA_9001", self.school_a, "Class 4", "B")   # grade 4
        self.sb = self._student("OTH_0001", self.school_b, "Class 4", "A")   # school B

        self.base_time = timezone.now() - timedelta(days=10)
        self._minutes = 0
        self.lesson1, self.sum1 = self._package("Lesson One", self.grade3)
        self.lesson2, self.sum2 = self._package("Lesson Two", self.grade3)
        self.boss1, self.sum_boss = self._package("Boss One", self.grade3, "ASSESSMENT")
        self.lesson_g4, self.sum_g4 = self._package("Grade 4 Lesson", self.grade4)
        self.lesson_g5, _ = self._package("Grade 5 Lesson", Grade.objects.create(grade_name="Grade 5", sort_order=5))

    # ---------------------------------------------------------------- data

    def _student(self, username, school, grade, section, active=True):
        user = User.objects.create_user(username=username, password=username, role=User.Role.STUDENT,
                                        full_name=f"Student {username.split('_')[-1]}", is_active=active)
        return Student.objects.create(user=user, school=school, roll_no="1", grade=grade, section=section,
                                      academic_year="2026-2027")

    def _package(self, title, grade, experience_type="LESSON"):
        self._minutes += 1
        exp = Experience.objects.create(title=title, grade=grade, subject="English", language="English",
                                        estimated_duration=10, experience_type=experience_type, status="APPROVED",
                                        created_by=self.author)
        Experience.objects.filter(pk=exp.pk).update(created_at=self.base_time + timedelta(minutes=self._minutes))
        pkg = PublishedPackage.objects.create(experience=exp, package_name=title, compression_status="COMPLETED")
        data = f"elab bytes of {title}".encode()
        path = os.path.join(self.tmp_dir, f"{pkg.id}.elab")
        with open(path, "wb") as f:
            f.write(data)
        checksum = hashlib.sha256(data).hexdigest()
        PublishVersion.objects.create(published_package=pkg, version_number="1.0", build_number=1,
                                      package_size=len(data), checksum=checksum, file_path=path,
                                      published_by=self.author)
        return pkg, checksum

    # ---------------------------------------------------------------- requests

    def _headers(self, token=None, session=None, ip="10.0.0.1"):
        headers = {"REMOTE_ADDR": ip}
        if token:
            headers["HTTP_X_HUB_TOKEN"] = token
        if session:
            headers["HTTP_X_SESSION_TOKEN"] = session
        return headers

    def get(self, path, token=None, session=None, **extra):
        return self.client.get(f"{BASE}/{path}", **self._headers(token, session), **extra)

    def post(self, path, body=None, token=None, session=None, ip="10.0.0.1", **extra):
        return self.client.post(f"{BASE}/{path}", data=json.dumps(body if body is not None else {}),
                                content_type="application/json", **self._headers(token, session, ip), **extra)

    def put(self, path, body, token=None, session=None):
        return self.client.put(f"{BASE}/{path}", data=json.dumps(body), content_type="application/json",
                               **self._headers(token, session))

    def delete(self, path, token=None, session=None):
        return self.client.delete(f"{BASE}/{path}", **self._headers(token, session))

    def pair(self, school=None, pc_id=None, pc_name="Lab PC 1", ip="10.0.0.1"):
        school = school or self.school_a
        response = self.post("pair", {
            "schoolCode": school.schoolId,
            "pairingCode": current_pairing_code(school).code,
            "pcId": pc_id or str(uuid.uuid4()),
            "pcName": pc_name,
        }, ip=ip)
        self.assertEqual(response.status_code, 200, response.content)
        return response.json()["hubToken"]

    def login(self, token, code="AAR_1001", rejoin=None):
        body = {"code": code}
        if rejoin is not None:
            body["rejoin"] = rejoin
        return self.post("login", body, token=token)

    def session(self, token, code="AAR_1001"):
        response = self.login(token, code)
        self.assertEqual(response.status_code, 200, response.content)
        return response.json()["sessionToken"]

    def download(self, path, token, session=None, **extra):
        response = self.client.get(f"{BASE}/{path}", **self._headers(token, session), **extra)
        body = b"".join(response.streaming_content) if getattr(response, "streaming", False) else response.content
        return response, body
