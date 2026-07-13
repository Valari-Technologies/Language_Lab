from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Creates or updates a Content Creator user account"

    def add_arguments(self, parser):
        parser.add_argument("username", type=str, help="Username of the content creator")
        parser.add_argument("email", type=str, help="Email of the content creator")
        parser.add_argument("password", type=str, help="Password of the content creator")

    def handle(self, *args, **options):
        username = options["username"]
        email = options["email"]
        password = options["password"]

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "role": "CONTENT_CREATOR",
            }
        )

        user.set_password(password)
        if not created:
            user.email = email
            user.role = "CONTENT_CREATOR"
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"Successfully created Content Creator '{username}'."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Successfully updated User '{username}' to Content Creator role."))
