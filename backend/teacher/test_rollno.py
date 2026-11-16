from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from super_admin.models import School, SchoolAdminProfile
from teacher.models import Student
from teacher.rollno import find_roll_conflict

User = get_user_model()
URL = "/api/cms/v1/students/"


class RollNoUniqueTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.school = School.objects.create(schoolId="SCH-A", school_name="A", address="1", phone="1", email="a@x.test")
        self.other = School.objects.create(schoolId="SCH-B", school_name="B", address="2", phone="2", email="b@x.test")
        user = User.objects.create_user(username="admin", password="x", role=User.Role.SCHOOL_ADMIN)
        SchoolAdminProfile.objects.create(user=user, school=self.school)
        self.api.force_authenticate(user)
        self.first = self._add("arj", "1", "Class 5", "A")

    def _add(self, name, roll, grade, section, expected=201):
        res = self.api.post(URL, {"full_name": name, "roll_no": roll, "grade": grade, "section": section,
                                  "academic_year": "2026-2027"}, format="json")
        self.assertEqual(res.status_code, expected, res.content)
        return res

    def test_same_roll_no_in_the_same_section_is_refused(self):
        res = self._add("ravi", "01", "Class 5", "A", expected=400)  # "1" and "01" are the same roll no
        self.assertIn("already used by Arj", res.json()["roll_no"][0])
        self._add("zed", "1", "Grade 5", "Section A", expected=400)  # same grade and section, written differently
        self.assertEqual(Student.objects.filter(school=self.school).count(), 1)

    def test_other_section_grade_or_school_is_allowed(self):
        self._add("mani", "01", "Class 5", "D")
        self._add("abu", "01", "Class 3", "A")
        self._add("kim", "02", "Class 5", "A")
        admin_b = User.objects.create_user(username="adminb", password="x", role=User.Role.SCHOOL_ADMIN)
        SchoolAdminProfile.objects.create(user=admin_b, school=self.other)
        self.api.force_authenticate(admin_b)
        self._add("lee", "01", "Class 5", "A")  # another school may reuse the number

    def test_login_code_is_name_grade_rollno(self):
        code = lambda res: Student.objects.get(student_id=res.json()["data"]["id"]).lms_code
        vinoth3 = self._add("Vinoth", "11", "Class 3", "A")
        vinoth5 = self._add("Vinoth", "11", "Class 5", "A")  # same name and roll no in another grade: allowed
        vinod5b = self._add("Vinod", "11", "Class 5", "B")   # same grade, other section: the code gets a letter
        single = self._add("Vinay", "7", "Class 5", "A")
        self.assertEqual((code(vinoth3), code(vinoth5), code(vinod5b), code(single)),
                         ("VIN_G3_11", "VIN_G5_11", "VIN_G5_11B", "VIN_G5_07"))
        self._add("Vinoth", "11", "Class 5", "A", expected=400)  # the same section still refuses a repeated roll no

    def test_a_code_the_form_filled_in_is_rebuilt_but_a_hand_typed_code_is_kept(self):
        code = lambda res: Student.objects.get(student_id=res.json()["data"]["id"]).lms_code
        res = self.api.post(URL, {"full_name": "Kumar", "roll_no": "5", "grade": "Class 4", "section": "A", "username": "KUM_05",
                                  "academic_year": "2026-2027"}, format="json")  # the older form preview
        self.assertEqual(code(res), "KUM_G4_05")
        res = self.api.post(URL, {"full_name": "Kumar", "roll_no": "6", "grade": "Class 4", "section": "A", "username": "MYCODE",
                                  "academic_year": "2026-2027"}, format="json")
        self.assertEqual(code(res), "MYCODE")

        mani = self._add("mani", "02", "Class 5", "A").json()["data"]
        url = f"{URL}{mani['id']}/"
        res = self.api.put(url, {"full_name": "Mani Two", "roll_no": "02", "grade": "Class 5", "section": "A",
                                 "academic_year": "2026-2027"}, format="json")
        self.assertEqual(res.status_code, 200, res.content)  # only the name changed
        res = self.api.put(url, {"full_name": "Mani Two", "roll_no": "1", "grade": "Class 5", "section": "A",
                                 "academic_year": "2026-2027"}, format="json")
        self.assertEqual(res.status_code, 400)  # moving to a roll no already used in the section

    def test_an_existing_duplicate_does_not_block_editing_other_details(self):
        twin = Student.objects.create(user=User.objects.create_user(username="TWN_01", password="x", full_name="twin",
                                                                    role=User.Role.STUDENT),
                                      school=self.school, roll_no="1", grade="Class 5", section="A")
        res = self.api.put(f"{URL}{twin.student_id}/", {"full_name": "Twin New", "roll_no": "1", "grade": "Class 5",
                                                         "section": "A", "academic_year": "2026-2027"}, format="json")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertIsNotNone(find_roll_conflict(self.school, "Class 5", "A", "01"))
