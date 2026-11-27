from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from lmshub.models import DeletedStudent, LmsSession
from lmshub.views import code_key
from super_admin.models import SchoolAdminProfile
from teacher.models import Student
from .base import HubTestBase

User = get_user_model()


class DeactivatedAndDeletedStudentTests(HubTestBase):
    """A deactivated student cannot log in to the LMS (and says so); a deleted student is removed from the PCs too."""

    def setUp(self):
        super().setUp()
        admin = User.objects.create_user(username="admin_a", password="x", role=User.Role.SCHOOL_ADMIN)
        SchoolAdminProfile.objects.create(user=admin, school=self.school_a)
        self.cms = APIClient()
        self.cms.force_authenticate(admin)
        self.token = self.pair()

    def _set_active(self, student, active):
        body = {"is_active": active}
        response = self.cms.patch(f"/api/cms/v1/students/{student.student_id}/", body, format="json")
        self.assertEqual(response.status_code, 200, response.content)

    def test_a_deactivated_student_is_refused_with_their_own_answer(self):
        session = self.session(self.token, "AAR_1001")                         # working on a PC
        self._set_active(self.s1, False)
        self.assertEqual(LmsSession.objects.get().end_reason, "student_deactivated")  # logged out of the PC
        self.assertEqual(self.post("heartbeat", token=self.token, session=session).status_code, 401)
        for _ in range(8):                                                       # never counts towards the lock
            response = self.login(self.token, "AAR_1001")
            self.assertEqual((response.status_code, response.json()["error"]), (403, "student_deactivated"))
        self.assertIn("deactivated", response.json()["message"])
        self.assertEqual(self.login(self.token, "KAB_8001").status_code, 200)    # another student is not affected
        self.assertEqual(self.login(self.token, "NOBODY").json()["error"], "invalid_code")  # a wrong code still is
        self._set_active(self.s1, True)                                           # activated again: works
        self.assertEqual(self.login(self.token, "AAR_1001").status_code, 200)

    def test_the_offline_copy_names_the_deactivated_student(self):
        self._set_active(self.s1, False)
        data = self.get("offline-data", self.token).json()
        self.assertNotIn(self.s1.student_id, [s["id"] for s in data["students"]])
        entry = [d for d in data["deactivatedStudents"] if d["id"] == self.s1.student_id][0]
        self.assertIn(code_key(self.token, "AAR_1001"), entry["codeKeys"])
        self.assertNotIn("AAR_1001", str(data))                                  # still no plain codes

    def test_a_deleted_student_is_removed_from_the_cms_and_named_for_the_pcs(self):
        student_id, user_id = self.s1.student_id, self.s1.user_id
        response = self.cms.delete(f"/api/cms/v1/students/{student_id}/")
        self.assertIn(response.status_code, (200, 204))
        self.assertFalse(Student.objects.filter(pk=student_id).exists())         # the CMS data is gone
        self.assertFalse(User.objects.filter(pk=user_id).exists())
        self.assertEqual(DeletedStudent.objects.get().login_code, "AAR_1001")
        # the LMS login says so, and it is not a wrong-code attempt
        for _ in range(8):
            response = self.login(self.token, "AAR_1001")
            self.assertEqual((response.status_code, response.json()["error"], response.json()["studentId"]),
                             (404, "student_deleted", student_id))
        # the offline copy tells the PC to delete the local data
        data = self.get("offline-data", self.token).json()
        gone = [d for d in data["deletedStudents"] if d["id"] == student_id][0]
        self.assertIn(code_key(self.token, "AAR_1001"), gone["codeKeys"])
        self.assertNotIn(student_id, [s["id"] for s in data["students"]])
        # other schools' PCs are not told
        other = self.get("offline-data", self.pair(self.school_b)).json()
        self.assertEqual(other["deletedStudents"], [])

    def test_a_code_given_to_a_new_student_is_not_deleted(self):
        self.cms.delete(f"/api/cms/v1/students/{self.s1.student_id}/")
        again = self._student("AAR_1001", self.school_a, "Class 3", "A")         # the code is used again
        self.assertEqual(self.login(self.token, "AAR_1001").status_code, 200)
        data = self.get("offline-data", self.token).json()
        self.assertEqual(data["deletedStudents"], [])
        self.assertIn(again.student_id, [s["id"] for s in data["students"]])
