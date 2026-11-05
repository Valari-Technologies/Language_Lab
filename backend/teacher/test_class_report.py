from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from assessments.models import ExperienceAssignment, StudentAttempt
from content_studio.models import Experience, PublishedPackage, PublishVersion
from school_admin.models import Class, Teacher, TeacherClass
from super_admin.models import Grade, School
from teacher.models import Student

User = get_user_model()
URL = "/api/cms/v1/teacher/reports/class/"


class TeacherClassReportTests(TestCase):
    """The class list: 10 students a page, search, sort, filters, overview cards, progress and performance labels."""

    def setUp(self):
        self.api = APIClient()
        self.grade = Grade.objects.create(grade_name="Class 5", sort_order=5)
        self.school = School.objects.create(schoolId="SCH-A", school_name="A", address="1", phone="1", email="a@x.test")
        self.other = School.objects.create(schoolId="SCH-B", school_name="B", address="2", phone="2", email="b@x.test")
        self.author = User.objects.create_user(username="author", password="x", role=User.Role.CONTENT_CREATOR)
        self.teacher = User.objects.create_user(username="teach", password="x", role=User.Role.TEACHER)
        klass = Class.objects.create(school=self.school, class_name="Class 5-A", grade=self.grade, academic_year="2026-2027")
        TeacherClass.objects.create(teacher=Teacher.objects.create(user=self.teacher, school=self.school), class_obj=klass)
        self.class_id = klass.class_id
        self.api.force_authenticate(self.teacher)
        # six published lessons (levels 1-6: zone 1 has five, zone 2 has one) and one assessment (B1)
        self.lessons = [self._published(f"Lesson {n}", "LESSON") for n in range(1, 7)]
        self.boss = self._published("Boss", "ASSESSMENT")
        self.students = [self._student(f"S{n:02d}", f"Student {n:02d}", str(n)) for n in range(1, 26)]
        self.seq = 0

    def _published(self, title, kind):
        exp = Experience.objects.create(title=title, grade=self.grade, subject="English", language="English",
                                        difficulty="BEGINNER", estimated_duration=10, experience_type=kind,
                                        status="APPROVED", created_by=self.author)
        pkg = PublishedPackage.objects.create(experience=exp, package_name=title, compression_status="COMPLETED")
        PublishVersion.objects.create(published_package=pkg, version_number="1.0", build_number=1, package_size=1,
                                      checksum="c", published_by=self.author)
        return exp

    def _student(self, code, name, roll, school=None, section="A", active=True):
        user = User.objects.create_user(username=f"{code}-{school.pk if school else 'x'}", password="x",
                                        role=User.Role.STUDENT, full_name=name, is_active=active)
        return Student.objects.create(user=user, school=school or self.school, roll_no=roll, grade="Class 5", section=section)

    def _attempt(self, student, exp, level_key, percentage=None, when=None, seconds=60, status="COMPLETED"):
        self.seq += 1
        assignment, _ = ExperienceAssignment.objects.get_or_create(
            school=student.school, experience_ref=str(exp.id),
            defaults={"experience_title": exp.title, "assigned_at": timezone.now()})
        when = when or timezone.now()
        return StudentAttempt.objects.create(
            assignment=assignment, student=student.user, school=student.school, started_at=when, completed_at=when,
            status=status, percentage=percentage, level_key=level_key, time_spent_seconds=seconds,
            lms_attempt_id=f"a-{self.seq}")

    def _get(self, **params):
        return self.api.get(URL, params).json()

    def _row(self, student, data=None):
        data = data or self._get(search=student.user.full_name)
        return next(r for r in data["students"] if r["id"] == student.student_id)

    def test_ten_students_a_page_and_pagination(self):
        self._student("OTHER", "Section B", "1", section="B")
        self._student("GONE", "Left School", "2", active=False)
        self._student("FOREIGN", "Other School", "3", school=self.other)
        first = self._get()
        self.assertEqual((first["total"], first["pages"], first["page"], len(first["students"])), (25, 3, 1, 10))
        self.assertEqual(first["students"][0]["name"], "Student 01")
        self.assertEqual(len(self._get(page=3)["students"]), 5)
        everyone = self._get(all=1)  # the downloaded report: all of them at once
        self.assertEqual((len(everyone["students"]), everyone["total"], everyone["pages"]), (25, 25, 1))
        self.assertEqual(len(self._get(all=1, performance="excellent")["students"]), 0)
        self.assertEqual(self._get(page=99)["page"], 3)  # a page beyond the end shows the last one
        self.assertEqual(self._get(page="x")["page"], 1)
        names = [r["name"] for p in (1, 2, 3) for r in self._get(page=p)["students"]]
        self.assertEqual(len(set(names)), 25)
        self.assertNotIn("Section B", names)  # another section, an inactive student and another school stay out

    def test_search_by_name_or_roll_number(self):
        self.assertEqual([r["name"] for r in self._get(search="student 07")["students"]], ["Student 07"])
        self.assertEqual([r["name"] for r in self._get(search="07")["students"]], ["Student 07"])  # 07 is also roll 7
        self.assertEqual(self._get(search="zzz")["total"], 0)
        self.assertEqual(self._get(search="1")["total"] > 1, True)

    def test_progress_zones_levels_and_time(self):
        s = self.students[0]
        for n, exp in enumerate(self.lessons[:5], start=1):
            self._attempt(s, exp, f"L{n}", seconds=120)
        row = self._row(s)
        self.assertEqual((row["levelsCompleted"], row["levelsTotal"], row["zonesCompleted"], row["zonesTotal"]), (5, 6, 1, 6))
        self.assertEqual((row["progress"], row["progressStatus"], row["learningSeconds"], row["attempts"]), (83, "in_progress", 600, 5))
        self._attempt(s, self.lessons[5], "L6")
        row = self._row(s)
        self.assertEqual((row["levelsCompleted"], row["zonesCompleted"], row["progress"], row["progressStatus"]), (6, 2, 100, "completed"))
        # an unfinished attempt is activity but not a completed level
        t = self.students[1]
        self._attempt(t, self.lessons[0], "L1", status="IN_PROGRESS")
        row = self._row(t)
        self.assertEqual((row["levelsCompleted"], row["progressStatus"], row["avgAssessment"]), (0, "in_progress", None))
        self.assertEqual(self._row(self.students[2])["progressStatus"], "not_started")

    def test_performance_labels_from_the_assessment_score(self):
        for student, score in zip(self.students[:4], (90, 75, 55, 30)):
            self._attempt(student, self.boss, "B1", percentage=score)
        labels = [self._row(s)["performance"] for s in self.students[:5]]
        self.assertEqual(labels, ["excellent", "good", "average", "needs_improvement", "not_assessed"])
        data = self._get()
        self.assertEqual(data["thresholds"], {"excellent": 85, "good": 70, "average": 50})
        self.assertEqual(data["overview"]["needsImprovement"], 1)
        self.assertEqual(data["overview"]["avgAssessment"], 62.5)  # (90 + 75 + 55 + 30) / 4
        # a lesson's score is not an assessment score
        self._attempt(self.students[4], self.lessons[0], "L1", percentage=10)
        self.assertEqual(self._row(self.students[4])["performance"], "not_assessed")

    def test_filters_sorting_and_overview_work_together(self):
        now = timezone.now()
        self._attempt(self.students[0], self.boss, "B1", percentage=90, when=now)
        self._attempt(self.students[1], self.boss, "B1", percentage=40, when=now - timedelta(days=30))  # inactive
        self._attempt(self.students[2], self.lessons[0], "L1", when=now - timedelta(days=3))
        data = self._get(activity="active")
        self.assertEqual(data["overview"]["activeStudents"], data["total"])
        self.assertEqual(self._get(activity="inactive")["total"], 25 - 2)  # all but the two recent ones
        self.assertEqual(self._get(performance="excellent")["total"], 1)
        self.assertEqual(self._get(performance="needs_improvement")["total"], 1)
        self.assertEqual(self._get(progress="in_progress")["total"], 3)
        self.assertEqual(self._get(zone=1)["total"], 3)  # the two assessments (B1) and the level 1 attempt
        self.assertEqual(self._get(zone=2)["total"], 0)
        today = now.date().isoformat()
        self.assertEqual(self._get(date_from=today)["total"], 1)
        self.assertEqual(self._get(date_from=(now - timedelta(days=5)).date().isoformat())["total"], 2)
        self.assertEqual(self._get(date_to=(now - timedelta(days=10)).date().isoformat())["total"], 1)
        # filters, search and sort together
        data = self._get(performance="good", search="x")
        self.assertEqual(data["total"], 0)
        scores = self._get(sort="score", order="desc")["students"]
        self.assertEqual([r["avgAssessment"] for r in scores[:2]], [90.0, 40.0])
        self.assertTrue(all(r["avgAssessment"] is None for r in scores[2:]))  # no score: always at the end
        ascending = self._get(sort="score", order="asc")["students"]
        self.assertEqual([r["avgAssessment"] for r in ascending[:2]], [40.0, 90.0])
        recent = self._get(sort="last_active", order="desc")["students"]
        self.assertEqual(recent[0]["name"], "Student 01")
        by_name = self._get(sort="name", order="desc")["students"]
        self.assertEqual(by_name[0]["name"], "Student 25")
        # the cards follow the filters but not the search
        both = self._get(activity="active", search="Student 01")
        self.assertEqual((both["total"], both["overview"]["totalStudents"]), (1, 2))

    def test_best_and_least_performing(self):
        # best = the Excellent and Good students (70% and over); least = the Average and Needs Improvement students (below 70%)
        for student, score in zip(self.students[:10], (99, 95, 90, 85, 75, 65, 55, 45, 35, 20)):
            self._attempt(student, self.boss, "B1", percentage=score)
        ranking = self._get()["ranking"]
        self.assertEqual([r["avgAssessment"] for r in ranking["best"]], [99.0, 95.0, 90.0])  # the three highest
        self.assertEqual([r["avgAssessment"] for r in ranking["least"]], [20.0, 35.0, 45.0])  # the three lowest
        # the cards open the full lists of their group
        best = self._get(performance="best", sort="score", order="desc")
        self.assertEqual((best["total"], [r["avgAssessment"] for r in best["students"]]), (5, [99.0, 95.0, 90.0, 85.0, 75.0]))
        least = self._get(performance="least", sort="score", order="asc")
        self.assertEqual((least["total"], [r["avgAssessment"] for r in least["students"]]), (5, [20.0, 35.0, 45.0, 55.0, 65.0]))
        self.assertEqual(self._get(performance="needs_improvement")["total"], 3)
        # only one student with a score: a Good one is on the best card and never on the least card
        for student in self.students[1:10]:
            StudentAttempt.objects.filter(student=student.user).delete()
        StudentAttempt.objects.filter(student=self.students[0].user).update(percentage=73)
        ranking = self._get()["ranking"]
        self.assertEqual(([r["avgAssessment"] for r in ranking["best"]], ranking["least"]), ([73.0], []))
        # an Average student (55%) goes to the least card, not the best card
        StudentAttempt.objects.filter(student=self.students[0].user).update(percentage=55)
        ranking = self._get()["ranking"]
        self.assertEqual(([r["avgAssessment"] for r in ranking["best"]], [r["avgAssessment"] for r in ranking["least"]]), ([], [55.0]))

    def _export(self, **params):
        import io

        import openpyxl
        res = self.api.get(URL + "export/", params)
        self.assertEqual(res.status_code, 200, res.content)
        self.assertIn("spreadsheetml", res["Content-Type"])
        self.assertIn(".xlsx", res["Content-Disposition"])
        return list(openpyxl.load_workbook(io.BytesIO(res.content)).active.iter_rows(values_only=True))

    def test_excel_export_has_every_student_that_matches_the_filters(self):
        self._student("OTHER", "Section B", "1", section="B")
        self._student("FOREIGN", "Other School", "3", school=self.other)
        self._attempt(self.students[0], self.boss, "B1", percentage=90)
        self._attempt(self.students[1], self.lessons[0], "L1")
        rows = self._export()
        self.assertEqual(rows[0][:4], ("Student", "Student ID", "Roll No", "Class"))
        self.assertEqual(len(rows) - 1, 25)  # the whole class, not only the first page of 10; no other section or school
        first = rows[1]
        self.assertEqual((first[0], first[2], first[3], first[4]), ("Student 01", "1", "Class 5", "A"))
        self.assertEqual((first[5], first[6], first[9], first[10], first[13]), (0, "0/6", 90.0, 1, "Excellent"))
        # a filter, a search and a sort shape the file the same way as the list
        self.assertEqual([r[0] for r in self._export(performance="excellent")[1:]], ["Student 01"])
        self.assertEqual(len(self._export(search="Student 1")) - 1, self._get(search="Student 1")["total"])
        by_score = self._export(sort="score", order="desc")
        self.assertEqual((by_score[1][0], by_score[2][9]), ("Student 01", "Not assessed"))
        self.assertEqual(len(self._export(activity="active")) - 1, self._get(activity="active")["total"])

    def test_excel_export_of_the_class_that_was_chosen(self):
        grade8 = Grade.objects.create(grade_name="Class 8", sort_order=8)
        class_8a = Class.objects.create(school=self.school, class_name="Class 8-A", grade=grade8, academic_year="2026-2027")
        TeacherClass.objects.create(teacher=Teacher.objects.get(user=self.teacher), class_obj=class_8a)
        user = User.objects.create_user(username="HEL-1", password="x", role=User.Role.STUDENT, full_name="Hell")
        Student.objects.create(user=user, school=self.school, roll_no="1", grade="Class 8", section="A")
        self.assertEqual(len(self._export()) - 1, 26)  # both classes of the teacher
        five = self._export(class_id=self.class_id)
        self.assertEqual(len(five) - 1, 25)
        self.assertEqual({r[3] for r in five[1:]}, {"Class 5"})  # only the chosen class
        eight = self._export(class_id=class_8a.class_id)
        self.assertEqual([(r[0], r[3]) for r in eight[1:]], [("Hell", "Class 8")])
        res = self.api.get(URL + "export/", {"class_id": self.class_id})
        self.assertIn("Class-5-A", res["Content-Disposition"])  # the file name says which class

    def test_excel_export_for_a_teacher_without_classes_and_bad_values(self):
        for bad in ({"zone": 9}, {"performance": "star"}, {"class_id": 999999}, {"date_from": "yesterday"}):
            self.assertEqual(self.api.get(URL + "export/", bad).status_code, 400, bad)
        lonely = User.objects.create_user(username="lonely", password="x", role=User.Role.TEACHER)
        Teacher.objects.create(user=lonely, school=self.school)
        self.api.force_authenticate(lonely)
        self.assertEqual(len(self._export()), 1)  # only the header row
        for user in (self.students[0].user, User.objects.create_user(username="adm", password="x", role=User.Role.SCHOOL_ADMIN)):
            self.api.force_authenticate(user)
            self.assertEqual(self.api.get(URL + "export/").status_code, 403)

    def test_class_filter_and_bad_values(self):
        data = self._get()
        self.assertEqual(data["classes"], [{"id": self.class_id, "name": "Class 5-A"}])
        self.assertEqual([z["name"] for z in data["zones"]],
                         ["Summer Zone", "Winter Zone", "Spring Zone", "Island Zone", "Desert Zone", "Lava Zone"])
        self.assertEqual(self._get(class_id=self.class_id)["total"], 25)
        for bad in ({"class_id": 999999}, {"class_id": "x"}, {"zone": 9}, {"performance": "star"}, {"sort": "secret"},
                    {"order": "up"}, {"date_from": "yesterday"}, {"activity": "maybe"}):
            self.assertEqual(self.api.get(URL, bad).status_code, 400, bad)

    def test_only_teachers_and_a_teacher_without_classes(self):
        lonely = User.objects.create_user(username="lonely", password="x", role=User.Role.TEACHER)
        Teacher.objects.create(user=lonely, school=self.school)
        self.api.force_authenticate(lonely)
        data = self.api.get(URL).json()
        self.assertEqual((data["students"], data["total"], data["overview"]["totalStudents"]), ([], 0, 0))
        for user in (self.students[0].user, User.objects.create_user(username="adm", password="x", role=User.Role.SCHOOL_ADMIN)):
            self.api.force_authenticate(user)
            self.assertEqual(self.api.get(URL).status_code, 403)
        self.api.force_authenticate(None)
        self.assertIn(self.api.get(URL).status_code, (401, 403))
