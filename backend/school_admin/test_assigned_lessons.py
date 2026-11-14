from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from assessments.models import ExperienceAssignment
from content_studio.models import Experience
from school_admin.models import Class
from school_admin.serializers import ClassSerializer
from super_admin.models import Grade, School

User = get_user_model()


class AssignedLessonsDifficultyTests(TestCase):
    def setUp(self):
        self.grade = Grade.objects.create(grade_name="Class 3", sort_order=3)
        self.school = School.objects.create(schoolId="SCH-A", school_name="A", address="1", phone="1", email="a@x.test")
        self.klass = Class.objects.create(school=self.school, class_name="Class 3-A", grade=self.grade, academic_year="2026-2027")
        self.author = User.objects.create_user(username="author", password="x", role=User.Role.CONTENT_CREATOR)

    def _lesson(self, title, difficulty):
        return Experience.objects.create(title=title, grade=self.grade, subject="Grammar", language="English",
                                         difficulty=difficulty, estimated_duration=10, status="DRAFT", created_by=self.author)

    def _assign(self, ref, title):
        return ExperienceAssignment.objects.create(school=self.school, class_obj=self.klass, grade=self.grade,
                                                   experience_ref=ref, experience_title=title, assigned_at=timezone.now())

    def test_assigned_lessons_keep_their_own_difficulty(self):
        easy = self._lesson("Easy one", "BEGINNER")
        hard = self._lesson("Hard one", "MASTER")
        self._assign(str(easy.id), easy.title)
        self._assign(f"EXP-{hard.id}", hard.title)
        self._assign("unknown-ref", "Not in Content Studio")
        lessons = {l["experience_title"]: l for l in ClassSerializer(self.klass).data["assigned_lessons"]}
        self.assertEqual((lessons["Easy one"]["difficulty"], lessons["Easy one"]["difficulty_display"]), ("BEGINNER", "Beginner"))
        self.assertEqual((lessons["Hard one"]["difficulty"], lessons["Hard one"]["difficulty_display"]), ("MASTER", "Master"))
        self.assertEqual(lessons["Hard one"]["subject"], "Grammar")
        self.assertEqual(lessons["Not in Content Studio"]["difficulty"], "INTERMEDIATE")  # no lesson to read it from

    def test_teacher_views_a_lesson_of_the_class(self):
        from rest_framework.test import APIClient
        from school_admin.models import Teacher, TeacherClass
        mine = self._lesson("Mine", "BEGINNER")
        mine.status = "APPROVED"
        mine.save()
        self._assign(str(mine.id), mine.title)
        data = {l["experience_title"]: l for l in ClassSerializer(self.klass).data["assigned_lessons"]}
        self.assertEqual(data["Mine"]["experience_id"], mine.id)  # the card's View button opens this lesson

        other_grade = Grade.objects.create(grade_name="Class 9", sort_order=9)
        elsewhere = Experience.objects.create(title="Elsewhere", grade=other_grade, subject="English", language="English",
                                              difficulty="BEGINNER", estimated_duration=10, status="APPROVED", created_by=self.author)
        teacher = User.objects.create_user(username="teach", password="x", role=User.Role.TEACHER)
        TeacherClass.objects.create(teacher=Teacher.objects.create(user=teacher, school=self.school), class_obj=self.klass)
        api = APIClient()
        api.force_authenticate(teacher)
        self.assertEqual(api.get(f"/api/v1/content/experiences/{mine.id}/preview/").status_code, 200)
        self.assertEqual(api.get(f"/api/v1/content/experiences/{elsewhere.id}/preview/").status_code, 404)  # not theirs
        # a published lesson whose newer version waits for approval can still be viewed; an unpublished draft cannot
        from content_studio.models import PublishedPackage
        mine.status = "PENDING_APPROVAL"
        mine.save()
        self.assertEqual(api.get(f"/api/v1/content/experiences/{mine.id}/preview/").status_code, 404)
        PublishedPackage.objects.create(experience=mine, package_name="Mine", compression_status="COMPLETED")
        self.assertEqual(api.get(f"/api/v1/content/experiences/{mine.id}/preview/").status_code, 200)
        student = User.objects.create_user(username="kid", password="x", role=User.Role.STUDENT)
        api.force_authenticate(student)
        self.assertEqual(api.get(f"/api/v1/content/experiences/{mine.id}/preview/").status_code, 403)
