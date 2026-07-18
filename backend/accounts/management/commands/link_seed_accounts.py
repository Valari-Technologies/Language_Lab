import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from super_admin.models import School, SchoolAdminProfile, Grade
from school_admin.models import Teacher, Class

User = get_user_model()


class Command(BaseCommand):
    help = "Link seed accounts (super_admin, school_admin, teacher01, my_creator, student01) to realistic Schools, Grades, and Classes idempotently."

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
            # 1. Create or update main School (TIME Matriculation Higher Secondary School)
            school = School.objects.filter(school_name="TIME Matriculation Higher Secondary School").first()
            if not school:
                # If there's an existing first school (e.g. Default Seed School), update it, otherwise create
                school = School.objects.first()
                if school:
                    school.school_name = "TIME Matriculation Higher Secondary School"
                    school.address = "Araikulam, Tamil Nadu, 627117"
                    school.phone = "+91 4635 257100"
                    school.email = "contact@timematricschool.edu.in"
                    school.save()
                    self.stdout.write(self.style.SUCCESS(f"Updated existing first School to: '{school.school_name}'"))
                else:
                    school = School.objects.create(
                        school_name="TIME Matriculation Higher Secondary School",
                        address="Araikulam, Tamil Nadu, 627117",
                        phone="+91 4635 257100",
                        email="contact@timematricschool.edu.in",
                        is_active=True
                    )
                    self.stdout.write(self.style.SUCCESS(f"Created main School: '{school.school_name}'"))
            else:
                school.address = "Araikulam, Tamil Nadu, 627117"
                school.phone = "+91 4635 257100"
                school.email = "contact@timematricschool.edu.in"
                school.save()
                self.stdout.write(f"Using/Verified main School: '{school.school_name}'")

            # 1b. Create or update second School (replacing any E2E Test School or creating new)
            second_school = School.objects.filter(school_name="St. Joseph's Higher Secondary School").first()
            if not second_school:
                # Try to find a school named "E2E Test School" to rename/update
                second_school = School.objects.filter(school_name="E2E Test School").first()
                if second_school:
                    second_school.school_name = "St. Joseph's Higher Secondary School"
                    second_school.address = "Trichy Road, Coimbatore, Tamil Nadu, 641005"
                    second_school.phone = "+91 422 230 1192"
                    second_school.email = "info@stjosephscbe.edu.in"
                    second_school.save()
                    self.stdout.write(self.style.SUCCESS(f"Updated E2E Test School to: '{second_school.school_name}'"))
                else:
                    second_school = School.objects.create(
                        school_name="St. Joseph's Higher Secondary School",
                        address="Trichy Road, Coimbatore, Tamil Nadu, 641005",
                        phone="+91 422 230 1192",
                        email="info@stjosephscbe.edu.in",
                        is_active=True
                    )
                    self.stdout.write(self.style.SUCCESS(f"Created second School: '{second_school.school_name}'"))
            else:
                second_school.address = "Trichy Road, Coimbatore, Tamil Nadu, 641005"
                second_school.phone = "+91 422 230 1192"
                second_school.email = "info@stjosephscbe.edu.in"
                second_school.save()
                self.stdout.write(f"Using/Verified second School: '{second_school.school_name}'")

            # Clean up/update any remaining schools with placeholder names containing "test"
            placeholder_schools = School.objects.filter(school_name__icontains="test")
            for idx, ps_school in enumerate(placeholder_schools, start=1):
                old_name = ps_school.school_name
                new_name = f"National Public School Chennai {idx}"
                ps_school.school_name = new_name
                ps_school.address = "100, Mount Road, Chennai, Tamil Nadu, 600002"
                ps_school.phone = "+91 44 2852 1111"
                ps_school.email = f"contact{idx}@npschennai.edu.in"
                ps_school.save()
                self.stdout.write(self.style.WARNING(f"Renamed placeholder school '{old_name}' to '{new_name}'"))

            # 1c. Create/update super_admin
            super_user = User.objects.filter(username="super_admin").first()
            if not super_user:
                super_user = User.objects.create_superuser(
                    username="super_admin",
                    email="superadmin@languagelab.edu.in",
                    password=os.environ.get("SUPER_ADMIN_PASSWORD") or "admin123",
                    role="SUPER_ADMIN",
                    full_name="Super Admin Staff"
                )
                self.stdout.write(self.style.SUCCESS("Created 'super_admin' user."))
            else:
                super_user.email = "superadmin@languagelab.edu.in"
                super_user.role = "SUPER_ADMIN"
                super_user.full_name = "Super Admin Staff"
                super_user.save()
                self.stdout.write(self.style.SUCCESS("Updated/verified 'super_admin' user."))

            # 2. Link school_admin
            admin_user = User.objects.filter(username="school_admin").first()
            if not admin_user:
                if not school_admin_pass:
                    self.stdout.write(self.style.WARNING("Username 'school_admin' not found and no password provided. Skipping creation."))
                else:
                    admin_user = User.objects.create_user(
                        username="school_admin",
                        email="schooladmin@timematricschool.edu.in",
                        password=school_admin_pass,
                        role="SCHOOL_ADMIN",
                        full_name="Karthik Subramanian"
                    )
                    self.stdout.write(self.style.SUCCESS("Created 'school_admin' user."))
            else:
                admin_user.email = "schooladmin@timematricschool.edu.in"
                admin_user.role = "SCHOOL_ADMIN"
                admin_user.full_name = "Karthik Subramanian"
                admin_user.save()
                self.stdout.write(self.style.SUCCESS("Updated/verified 'school_admin' user."))

            if admin_user:
                profile, created = SchoolAdminProfile.objects.get_or_create(
                    user=admin_user,
                    defaults={"school": school}
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Linked 'school_admin' to School '{school.school_name}' via SchoolAdminProfile."))
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
                        email="rajesh.kumar@timematricschool.edu.in",
                        password=teacher_pass,
                        role="TEACHER",
                        full_name="Rajesh Kumar"
                    )
                    self.stdout.write(self.style.SUCCESS("Created 'teacher01' user."))
            else:
                teacher_user.email = "rajesh.kumar@timematricschool.edu.in"
                teacher_user.role = "TEACHER"
                teacher_user.full_name = "Rajesh Kumar"
                teacher_user.save()
                self.stdout.write(self.style.SUCCESS("Updated/verified 'teacher01' user."))

            if teacher_user:
                teacher, created = Teacher.objects.get_or_create(
                    user=teacher_user,
                    defaults={
                        "school": school,
                        "qualification": "M.Sc. B.Ed. English",
                        "experience_years": 8
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Linked 'teacher01' to School '{school.school_name}' via Teacher profile."))
                else:
                    # Idempotently ensure correct school
                    teacher.school = school
                    teacher.qualification = "M.Sc. B.Ed. English"
                    teacher.experience_years = 8
                    teacher.save()
                    self.stdout.write(self.style.SUCCESS(f"Updated Teacher profile for 'teacher01'."))

            # 3b. Create/update content creator my_creator
            creator_user = User.objects.filter(username="my_creator").first()
            if not creator_user:
                creator_user = User.objects.create_user(
                    username="my_creator",
                    email="creator@languagelab.edu.in",
                    password=os.environ.get("CREATOR_PASSWORD") or "creator123",
                    role="CONTENT_CREATOR",
                    full_name="Devanand Sharma"
                )
                self.stdout.write(self.style.SUCCESS("Created 'my_creator' user."))
            else:
                creator_user.email = "creator@languagelab.edu.in"
                creator_user.role = "CONTENT_CREATOR"
                creator_user.full_name = "Devanand Sharma"
                creator_user.save()
                self.stdout.write(self.style.SUCCESS("Updated/verified 'my_creator' user."))

            # 3c. Create/update default student (student01)
            student_user = User.objects.filter(username="student01").first()
            if not student_user:
                student_user = User.objects.create_user(
                    username="student01",
                    email="aravind.swamy@gmail.com",
                    password="student123",
                    role="STUDENT",
                    full_name="Aravind Swamy"
                )
                self.stdout.write(self.style.SUCCESS("Created 'student01' user."))
            else:
                student_user.email = "aravind.swamy@gmail.com"
                student_user.role = "STUDENT"
                student_user.full_name = "Aravind Swamy"
                student_user.save()
                self.stdout.write(self.style.SUCCESS("Updated/verified 'student01' user."))

            # Ensure Student profile exists for student01
            from teacher.models import Student
            student_profile, created = Student.objects.get_or_create(
                user=student_user,
                defaults={"school": school}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created Student profile for '{student_user.username}'."))
            else:
                student_profile.school = school
                student_profile.save()
                self.stdout.write(self.style.SUCCESS(f"Verified Student profile for '{student_user.username}'."))

            # Clean up/update any remaining students with placeholder names containing "test"
            placeholder_students = User.objects.filter(role="STUDENT", full_name__icontains="test")
            for ps in placeholder_students:
                old_name = ps.full_name
                ps.full_name = "Abhishek Sharma"
                ps.email = f"{ps.username}@languagelab.edu.in"
                ps.save()
                self.stdout.write(self.style.WARNING(f"Renamed placeholder student '{old_name}' (username: {ps.username}) to Abhishek Sharma"))

            # 4. Create Grades 1 to 10
            grades = {}
            for g_num in range(1, 11):
                g_name = f"Grade {g_num}"
                grade_obj = Grade.objects.filter(grade_name=g_name).first()
                if not grade_obj:
                    grade_obj = Grade.objects.create(
                        grade_name=g_name,
                        description=f"Standard {g_name} level curriculum",
                        sort_order=g_num
                    )
                    self.stdout.write(self.style.SUCCESS(f"Created Grade: '{grade_obj.grade_name}'"))
                else:
                    self.stdout.write(f"Using/Verified Grade: '{grade_obj.grade_name}'")
                grades[g_num] = grade_obj

            grade = grades[6]

            # 5. Create default Class 6-A and link to TIME school and Grade 6
            cls_obj = Class.objects.filter(class_name="Class 6-A").first()
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
                cls_obj.school = school
                cls_obj.grade = grade
                cls_obj.save()
                self.stdout.write(f"Using/Updated Class: '{cls_obj.class_name}'")

        self.stdout.write(self.style.SUCCESS("link_seed_accounts command finished successfully."))
