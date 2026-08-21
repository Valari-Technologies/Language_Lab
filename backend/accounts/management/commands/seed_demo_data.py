from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from assessments.models import ExperienceAssignment, ScreenResponse, StudentAttempt
from content_studio.models import (
    Activity,
    ActivitySkill,
    Experience,
    LearningOutcome,
    Notification,
    PublishedPackage,
    PublishVersion,
    Screen,
    ValidationReport,
)
from school_admin.models import Class as SchoolClass
from school_admin.models import Teacher, TeacherClass
from super_admin.models import Grade, License, LmsServer, School, SchoolAdminProfile
from teacher.models import Student


User = get_user_model()


DEMO_PASSWORDS = {
    "super_admin": "SuperAdmin@123",
    "content_creator": "Creator@123",
    "school_admin": "SchoolAdmin@123",
    "teacher_demo": "Teacher@123",
    "DEMO001": "DEMO001",
}


def upsert_first(model, lookup, defaults=None):
    defaults = defaults or {}
    instance = model.objects.filter(**lookup).first()
    created = False
    if instance is None:
        instance = model.objects.create(**lookup, **defaults)
        created = True
    else:
        for field, value in defaults.items():
            setattr(instance, field, value)
        instance.save()
    return instance, created


class Command(BaseCommand):
    help = "Seed idempotent demo data for newly configured Language Lab environments."

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-reset-passwords",
            action="store_true",
            help="Do not reset passwords for existing demo users.",
        )

    def handle(self, *args, **options):
        reset_passwords = not options["no_reset_passwords"]

        with transaction.atomic():
            grades = self.seed_grades()
            school = self.seed_school()
            self.seed_license(school)

            super_admin = self.upsert_user(
                username="super_admin",
                email="superadmin@languagelab.demo",
                full_name="OneTutor Super Admin",
                role=User.Role.SUPER_ADMIN,
                password=DEMO_PASSWORDS["super_admin"],
                reset_passwords=reset_passwords,
                is_staff=True,
                is_superuser=True,
            )
            content_creator = self.upsert_user(
                username="content_creator",
                email="creator@languagelab.demo",
                full_name="Maya Content Creator",
                role=User.Role.CONTENT_CREATOR,
                password=DEMO_PASSWORDS["content_creator"],
                reset_passwords=reset_passwords,
            )
            school_admin = self.upsert_user(
                username="school_admin",
                email="admin@onetutor-demo-school.edu",
                full_name="Ananya School Admin",
                role=User.Role.SCHOOL_ADMIN,
                password=DEMO_PASSWORDS["school_admin"],
                reset_passwords=reset_passwords,
            )
            teacher_user = self.upsert_user(
                username="teacher_demo",
                email="teacher@onetutor-demo-school.edu",
                full_name="Ravi English Teacher",
                role=User.Role.TEACHER,
                password=DEMO_PASSWORDS["teacher_demo"],
                reset_passwords=reset_passwords,
            )
            student_user = self.upsert_user(
                username="DEMO001",
                email="demo001@languagelab.demo",
                full_name="Aarav Demo Student",
                role=User.Role.STUDENT,
                password=DEMO_PASSWORDS["DEMO001"],
                reset_passwords=reset_passwords,
            )

            SchoolAdminProfile.objects.update_or_create(
                user=school_admin,
                defaults={"school": school},
            )

            grade_six = grades["Grade 6"]
            class_six_a, _ = upsert_first(
                SchoolClass,
                {"school": school, "class_name": "Class 6-A"},
                {
                    "grade": grade_six,
                    "academic_year": "2026-2027",
                    "is_active": True,
                },
            )
            class_six_b, _ = upsert_first(
                SchoolClass,
                {"school": school, "class_name": "Class 6-B"},
                {
                    "grade": grade_six,
                    "academic_year": "2026-2027",
                    "is_active": True,
                },
            )

            teacher, _ = Teacher.objects.update_or_create(
                user=teacher_user,
                defaults={
                    "school": school,
                    "qualification": "M.A. English, B.Ed.",
                    "experience_years": 7,
                },
            )
            TeacherClass.objects.get_or_create(teacher=teacher, class_obj=class_six_a)
            TeacherClass.objects.get_or_create(teacher=teacher, class_obj=class_six_b)

            Student.objects.update_or_create(
                user=student_user,
                defaults={
                    "school": school,
                    "roll_no": "DEMO001",
                    "grade": "Grade 6",
                    "section": "A",
                },
            )

            experience = self.seed_content_studio(content_creator, grade_six)
            self.seed_assignment_and_attempts(school, class_six_a, grade_six, teacher_user, student_user, experience)
            self.seed_notifications(super_admin, content_creator, school_admin, teacher_user)

        self.stdout.write(self.style.SUCCESS("Demo seed data is ready."))
        self.print_credentials()

    def upsert_user(
        self,
        username,
        email,
        full_name,
        role,
        password,
        reset_passwords,
        is_staff=False,
        is_superuser=False,
    ):
        user, created = User.objects.get_or_create(username=username)
        user.email = email
        user.full_name = full_name
        user.role = role
        user.is_active = True
        user.is_staff = is_staff
        user.is_superuser = is_superuser
        if created or reset_passwords:
            user.set_password(password)
        user.save()
        return user

    def seed_grades(self):
        grades = {}
        for grade_number in range(1, 11):
            grade_name = f"Grade {grade_number}"
            grade, _ = Grade.objects.update_or_create(
                grade_name=grade_name,
                defaults={
                    "description": f"Demo curriculum level for {grade_name}.",
                    "sort_order": grade_number,
                },
            )
            grades[grade_name] = grade
        return grades

    def seed_school(self):
        school, _ = School.objects.update_or_create(
            schoolId="DEMO-SCHOOL-001",
            defaults={
                "school_name": "OneTutor Demo School",
                "address": "12 Demo Learning Street, Chennai, Tamil Nadu",
                "phone": "+91 98765 43210",
                "email": "contact@onetutor-demo-school.edu",
                "contactEmail": "admin@onetutor-demo-school.edu",
                "school_code": "OT-DEMO",
                "is_active": True,
            },
        )
        return school

    def seed_license(self, school):
        expiry_date = timezone.localdate() + timedelta(days=365)
        license_obj, _ = License.objects.update_or_create(
            licenseId="DEMO-LIC-001",
            defaults={
                "licenseKey": "DEMO-LICENSE-KEY-001",
                "school": school,
                "maxLmsServers": 2,
                "concurrentUsersPerServer": 40,
                "expiryDate": expiry_date,
                "status": License.Status.ACTIVE,
            },
        )
        school.licenseId = license_obj
        school.save(update_fields=["licenseId"])
        LmsServer.objects.update_or_create(
            installationId="DEMO-LMS-001",
            defaults={
                "serverName": "Demo Language Lab LMS",
                "school": school,
                "license": license_obj,
                "status": LmsServer.Status.ACTIVE,
                "lastSyncTime": timezone.now(),
                "currentCapacity": 24,
            },
        )

    def seed_content_studio(self, content_creator, grade):
        experience, _ = upsert_first(
            Experience,
            {"title": "Demo English Conversation: At the Market"},
            {
                "description": "A short interactive English conversation experience for a classroom demo.",
                "grade": grade,
                "subject": "English",
                "language": "English",
                "difficulty": Experience.Difficulty.BEGINNER,
                "experience_type": "LESSON",
                "mastery_threshold": 70,
                "estimated_duration": 20,
                "status": Experience.Status.APPROVED,
                "tags": ["demo", "conversation", "speaking", "listening"],
                "created_by": content_creator,
                "is_deleted": False,
            },
        )

        for outcome_text in [
            "Understand common vocabulary used in a market conversation.",
            "Practice short polite questions and answers while buying items.",
        ]:
            upsert_first(LearningOutcome, {"experience": experience, "text": outcome_text})

        listening_skill, _ = ActivitySkill.objects.get_or_create(
            name="Listening",
            defaults={"description": "Listen and understand spoken English prompts."},
        )
        speaking_skill, _ = ActivitySkill.objects.get_or_create(
            name="Speaking",
            defaults={"description": "Practice clear spoken responses."},
        )

        activity, _ = upsert_first(
            Activity,
            {"experience": experience, "display_order": 1},
            {
                "title": "Market Conversation Practice",
                "description": "Students listen to a short dialogue and answer quick checks.",
                "learning_objective": "Build confidence using everyday market vocabulary.",
                "activity_type": "SPEAKING",
                "estimated_duration": 12,
                "mastery_threshold": 80,
            },
        )
        activity.skills.set([listening_skill, speaking_skill])

        upsert_first(
            Screen,
            {"activity": activity, "display_order": 1},
            {
                "title": "Warm-up Vocabulary",
                "screen_type": Screen.ScreenType.INFORMATION,
                "status": Screen.ScreenStatus.COMPLETE,
                "estimated_duration": 120,
                "content": {
                    "heading": "At the Market",
                    "body": "Learn the words vendor, customer, price, and change.",
                },
            },
        )
        upsert_first(
            Screen,
            {"activity": activity, "display_order": 2},
            {
                "title": "Dialogue Practice",
                "screen_type": Screen.ScreenType.DIALOGUE,
                "status": Screen.ScreenStatus.COMPLETE,
                "estimated_duration": 240,
                "content": {
                    "turns": [
                        {"speaker": "Customer", "text": "How much are these apples?"},
                        {"speaker": "Vendor", "text": "They are fifty rupees per kilo."},
                    ]
                },
            },
        )
        upsert_first(
            Screen,
            {"activity": activity, "display_order": 3},
            {
                "title": "Quick Check",
                "screen_type": Screen.ScreenType.QUIZ,
                "status": Screen.ScreenStatus.COMPLETE,
                "estimated_duration": 180,
                "content": {
                    "question": "What does the customer ask about?",
                    "options": ["The price", "The weather", "The school"],
                    "answer": "The price",
                },
            },
        )

        ValidationReport.objects.update_or_create(
            experience=experience,
            defaults={
                "results": {"metadata": "passed", "hierarchy": "passed", "media": "not_required"},
                "total_checks": 3,
                "passed": 3,
                "warnings": 0,
                "errors": 0,
                "status": "PASSED",
                "validated_by": content_creator,
            },
        )
        package, _ = PublishedPackage.objects.update_or_create(
            experience=experience,
            defaults={
                "package_name": "demo-english-conversation-at-the-market.elab",
                "output_format": ".elab",
                "compression_status": "READY",
                "include_analytics": True,
            },
        )
        PublishVersion.objects.update_or_create(
            published_package=package,
            version_number="1.0.0-demo",
            defaults={
                "build_number": 1,
                "release_notes": "Seeded demo package metadata for classroom walkthroughs.",
                "package_size": 0,
                "download_url": "",
                "published_by": content_creator,
            },
        )
        return experience

    def seed_assignment_and_attempts(self, school, class_obj, grade, teacher_user, student_user, experience):
        assignment, _ = upsert_first(
            ExperienceAssignment,
            {
                "school": school,
                "experience_ref": f"content-studio-experience-{experience.id}",
                "class_obj": class_obj,
            },
            {
                "experience_title": experience.title,
                "grade": grade,
                "assigned_by": teacher_user,
                "assigned_at": timezone.now() - timedelta(days=2),
            },
        )
        attempt, _ = StudentAttempt.objects.update_or_create(
            lms_attempt_id="DEMO-LMS-ATTEMPT-001",
            defaults={
                "assignment": assignment,
                "student": student_user,
                "school": school,
                "started_at": timezone.now() - timedelta(days=1, hours=1),
                "completed_at": timezone.now() - timedelta(days=1),
                "status": "COMPLETED",
                "total_score": Decimal("8.00"),
                "max_score": Decimal("10.00"),
                "percentage": Decimal("80.00"),
                "time_spent_seconds": 720,
            },
        )
        upsert_first(
            ScreenResponse,
            {"attempt": attempt, "screen_ref": "demo-screen-quick-check"},
            {
                "school": school,
                "screen_title": "Quick Check",
                "screen_type": "QUIZ",
                "response_data": {"selected": "The price"},
                "score": Decimal("8.00"),
                "max_score": Decimal("10.00"),
                "is_correct": True,
                "time_spent_seconds": 90,
            },
        )

    def seed_notifications(self, super_admin, content_creator, school_admin, teacher_user):
        notifications = [
            (super_admin, "Demo environment ready", "Demo accounts, school, and content have been seeded."),
            (content_creator, "Demo experience approved", "Your market conversation experience is ready for review demos."),
            (school_admin, "Demo school configured", "Classes, teacher, and student records are available."),
            (teacher_user, "Demo experience assigned", "Class 6-A has one assigned demo experience."),
        ]
        for user, title, message in notifications:
            upsert_first(
                Notification,
                {"user": user, "title": title},
                {"message": message, "notification_type": Notification.NotificationType.INFO, "is_read": False},
            )

    def print_credentials(self):
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("Demo login credentials:"))
        self.stdout.write("Super Admin      username=super_admin      password=SuperAdmin@123")
        self.stdout.write("Content Creator  username=content_creator  password=Creator@123")
        self.stdout.write("School Admin     username=school_admin     password=SchoolAdmin@123")
        self.stdout.write("Teacher          username=teacher_demo     password=Teacher@123")
        self.stdout.write("Student/LMS      username=DEMO001          password=DEMO001")
