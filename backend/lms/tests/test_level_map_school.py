from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from super_admin.models import Grade, School, License, LmsServer
from teacher.models import Student
from content_studio.models import Experience, PublishedPackage, PublishVersion

User = get_user_model()
URL = "/api/packages/level-map/school/"


class SchoolLevelMapAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.author = User.objects.create_user(
            username="hub_map_author", password="Password123!", role=User.Role.CONTENT_CREATOR
        )
        self.grade5 = Grade.objects.create(grade_name="Grade 5", sort_order=5)
        self.grade6 = Grade.objects.create(grade_name="Grade 6", sort_order=6)
        self.grade7 = Grade.objects.create(grade_name="Grade 7", sort_order=7)
        self.school_a = School.objects.create(
            schoolId="SCH-A", school_name="School A", address="1 Main St", phone="100", email="a@school.test"
        )
        self.school_b = School.objects.create(
            schoolId="SCH-B", school_name="School B", address="2 Main St", phone="200", email="b@school.test"
        )
        future = timezone.now().date() + timedelta(days=365)
        self.license_a = License.objects.create(
            licenseId="LIC-A", licenseKey="KEY-A", school=self.school_a, expiryDate=future
        )
        self.license_b = License.objects.create(
            licenseId="LIC-B", licenseKey="KEY-B", school=self.school_b, expiryDate=future
        )
        self.server_a = LmsServer.objects.create(
            installationId="INST-A1", serverName="Hub A", licenseKey="LMS-KEY-A1",
            school=self.school_a, license=self.license_a, maxUsers=40,
        )
        self.server_b = LmsServer.objects.create(
            installationId="INST-B1", serverName="Hub B", licenseKey="LMS-KEY-B1",
            school=self.school_b, license=self.license_b, maxUsers=40,
        )
        self.base_time = timezone.now() - timedelta(days=30)
        self._minutes = 0

    def _make_student(self, username, school, grade, active=True):
        user = User.objects.create_user(
            username=username, password=username, role=User.Role.STUDENT, full_name=username, is_active=active
        )
        return Student.objects.create(user=user, school=school, roll_no="1", grade=grade)

    def _make_package(self, title, grade, experience_type="LESSON"):
        self._minutes += 1
        exp = Experience.objects.create(
            title=title, grade=grade, subject="English", language="English", estimated_duration=10,
            experience_type=experience_type, status="APPROVED", created_by=self.author, is_deleted=False,
        )
        Experience.objects.filter(pk=exp.pk).update(created_at=self.base_time + timedelta(minutes=self._minutes))
        pkg = PublishedPackage.objects.create(experience=exp, package_name=title, compression_status="COMPLETED")
        PublishVersion.objects.create(
            published_package=pkg, version_number="1.0", build_number=1,
            package_size=2048, checksum="abc123", published_by=self.author,
        )
        return pkg

    def _get(self, school="SCH-A", license_id="LIC-A", installation="INST-A1"):
        return self.client.get(
            URL, HTTP_X_SCHOOL_ID=school, HTTP_X_LICENSE_ID=license_id, HTTP_X_INSTALLATION_ID=installation
        )

    def _assert_forbidden(self, response):
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data, {"error": "hub_not_registered"})

    def test_missing_headers_forbidden(self):
        self._assert_forbidden(self.client.get(URL))
        self._assert_forbidden(self._get(installation=""))

    def test_unregistered_installation_forbidden(self):
        self._assert_forbidden(self._get(installation="INST-UNKNOWN"))

    def test_expired_or_inactive_license_forbidden(self):
        License.objects.filter(pk="LIC-A").update(expiryDate=timezone.now().date() - timedelta(days=1))
        self._assert_forbidden(self._get())
        License.objects.filter(pk="LIC-A").update(
            expiryDate=timezone.now().date() + timedelta(days=30), status=License.Status.SUSPENDED
        )
        self._assert_forbidden(self._get())

    def test_deactivated_server_forbidden(self):
        LmsServer.objects.filter(pk="INST-A1").update(status=LmsServer.Status.DEACTIVATED)
        self._assert_forbidden(self._get())

    def test_other_schools_installation_forbidden(self):
        self._assert_forbidden(self._get(installation="INST-B1"))
        self._assert_forbidden(self._get(license_id="LIC-B", installation="INST-B1"))
        self._assert_forbidden(self._get(school="SCH-B", license_id="LIC-A", installation="INST-A1"))

    def test_grades_only_from_this_school(self):
        self._make_student("A_CLASS5", self.school_a, "Class 5")
        self._make_student("A_FIVE", self.school_a, "5")
        self._make_student("A_GRADE6", self.school_a, "Grade 6")
        self._make_student("A_NINE", self.school_a, "Class 9")
        self._make_student("A_INACTIVE7", self.school_a, "Class 7", active=False)
        self._make_student("B_CLASS7", self.school_b, "Class 7")

        response = self._get()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["school"], {"id": self.school_a.school_id, "schoolId": "SCH-A", "name": "School A"})
        self.assertEqual(response.data["license"], {"concurrentUsersPerServer": 40})
        self.assertEqual([g["grade"]["id"] for g in response.data["grades"]], [self.grade5.id, self.grade6.id])
        self.assertEqual(response.data["unresolved_grades"], ["Class 9"])
        for entry in response.data["grades"]:
            self.assertEqual(len(entry["lessons"]), 30)
            self.assertEqual(len(entry["bosses"]), 6)

    def test_grade_output_equals_student_endpoint(self):
        self._make_student("DHA_12", self.school_a, "Class 5")
        for i in range(3):
            self._make_package(f"Lesson {i + 1}", self.grade5)
        self._make_package("Boss 1", self.grade5, experience_type="ASSESSMENT")
        self._make_package("Other grade lesson", self.grade6)

        student_map = self.client.get(
            "/api/packages/level-map/", {"login_code": "DHA_12", "school_id": "SCH-A"}
        ).data
        hub = self._get().data
        entry = next(g for g in hub["grades"] if g["grade"]["id"] == self.grade5.id)
        for key in ("grade", "counts", "lessons", "bosses"):
            self.assertEqual(entry[key], student_map[key], key)
