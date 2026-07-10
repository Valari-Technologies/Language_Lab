import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from super_admin.models import School, SchoolAdminProfile, Grade
from school_admin.models import Teacher, Class

User = get_user_model()


class Command(BaseCommand):
    help = "Link seed accounts (school_admin and teacher01) to a default School, Grade, and Class idempotently."

    def add_arguments(self, parser):
        parser.add_argument(
            "--school-admin-password",
            type=str,
            help="Password to set if school_admin user needs to be created.",
        )
        parser.add_argument(
            "--teacher-password",
            type=str,
            help="Password to set if teacher01 user needs to be created.",
        )

    def handle(self, *args, **options):
        school_admin_pass = options.get("school_admin_password") or os.environ.get("SCHOOL_ADMIN_PASSWORD")
        teacher_pass = options.get("teacher_password") or os.environ.get("TEACHER_PASSWORD")

        self.stdout.write("Starting link_seed_accounts management command...")

        with transaction.atomic():
            # 1. Create default School if none exists
            school = School.objects.first()
            if not school:
                school = School.objects.create(
                    school_name="Default Seed School",
                    address="123 Seed Lane",
                    phone="555-0100",
                    email="seed-school@example.com",
                    is_active=True
                )
                self.stdout.write(self.style.SUCCESS(f"Created default School: '{school.school_name}'"))
            else:
                self.stdout.write(f"Using existing School: '{school.school_name}'")

            # 2. Link school_admin
            admin_user = User.objects.filter(username="school_admin").first()
            if not admin_user:
                if not school_admin_pass:
                    self.stdout.write(self.style.WARNING("Username 'school_admin' not found and no password provided. Skipping creation."))
                else:
                    admin_user = User.objects.create_user(
                        username="school_admin",
                        email="admin@example.com",
                        password=school_admin_pass,
                        role="SCHOOL_ADMIN",
                        full_name="School Admin User"
                    )
                    self.stdout.write(self.style.SUCCESS("Created 'school_admin' user."))

            if admin_user:
                profile, created = SchoolAdminProfile.objects.get_or_create(
                    user=admin_user,
                    defaults={"school": school}
                )
                if created:
                    self.style.SUCCESS(f"Linked 'school_admin' to School '{school.school_name}' via SchoolAdminProfile.")
                else:
                    # Idempotently ensure correct school
                    if profile.school != school:
                        profile.school = school
                        profile.save()
                        self.stdout.write(self.style.SUCCESS(f"Updated SchoolAdminProfile for 'school_admin' to link to '{school.school_name}'."))
                    else:
                        self.stdout.write("SchoolAdminProfile for 'school_admin' already correct.")

            # 3. Link teacher01
            teacher_user = User.objects.filter(username="teacher01").first()
            if not teacher_user:
                if not teacher_pass:
                    self.stdout.write(self.style.WARNING("Username 'teacher01' not found and no password provided. Skipping creation."))
                else:
                    teacher_user = User.objects.create_user(
                        username="teacher01",
                        email="teacher01@example.com",
                        password=teacher_pass,
                        role="TEACHER",
                        full_name="Teacher 01 User"
                    )
                    self.stdout.write(self.style.SUCCESS("Created 'teacher01' user."))

            if teacher_user:
                teacher, created = Teacher.objects.get_or_create(
                    user=teacher_user,
                    defaults={
                        "school": school,
                        "qualification": "B.Ed. English",
                        "experience_years": 5
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Linked 'teacher01' to School '{school.school_name}' via Teacher profile."))
                else:
                    # Idempotently ensure correct school
                    if teacher.school != school:
                        teacher.school = school
                        teacher.save()
                        self.stdout.write(self.style.SUCCESS(f"Updated Teacher profile for 'teacher01' to link to '{school.school_name}'."))
                    else:
                        self.stdout.write("Teacher profile for 'teacher01' already correct.")

            # 4. Create default Grade and Class if none exist
            grade = Grade.objects.first()
            if not grade:
                grade = Grade.objects.create(
                    grade_name="Grade 6",
                    description="Standard Grade 6 level curriculum",
                    sort_order=6
                )
                self.stdout.write(self.style.SUCCESS(f"Created default Grade: '{grade.grade_name}'"))
            else:
                self.stdout.write(f"Using existing Grade: '{grade.grade_name}'")

            cls_obj = Class.objects.first()
            if not cls_obj:
                cls_obj = Class.objects.create(
                    school=school,
                    class_name="Class 6-A",
                    grade=grade,
                    academic_year="2026",
                    is_active=True
                )
                self.stdout.write(self.style.SUCCESS(f"Created default Class: '{cls_obj.class_name}'"))
            else:
                self.stdout.write(f"Using existing Class: '{cls_obj.class_name}'")

        self.stdout.write(self.style.SUCCESS("link_seed_accounts command finished successfully."))
