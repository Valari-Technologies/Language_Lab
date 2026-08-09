from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings


class Grade(models.Model):

    grade_name = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_("Class Name"),
        help_text=_("Unique name identifying the class level (up to 50 characters).")
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description"),
        help_text=_("A detailed description of the class requirements or standards.")
    )
    sort_order = models.IntegerField(
        verbose_name=_("Sort Order"),
        help_text=_("Defines the sequence in which classes are listed.")
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Created At")
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Updated At")
    )

    class Meta:
        verbose_name = _("Class")
        verbose_name_plural = _("Classes")
        ordering = ["sort_order", "grade_name"]
        db_table = "cms_grade"

    def __str__(self):
        return self.grade_name


class School(models.Model):
    school_id = models.AutoField(primary_key=True)
    school_name = models.CharField(max_length=150)
    address = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.CharField(max_length=100)
    logo = models.CharField(max_length=255, null=True, blank=True)
    school_code = models.CharField(max_length=50, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cms_school"

    def __str__(self):
        return self.school_name


class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100)
    duration_days = models.IntegerField(default=90)
    max_students = models.IntegerField(default=100)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cms_subscriptionplan"

    def __str__(self):
        return self.name


class SchoolSubscription(models.Model):
    class Status(models.TextChoices):
        ACTIVE_TRIAL = "ACTIVE_TRIAL", "Active Trial"
        ACTIVE_PAID = "ACTIVE_PAID", "Active Paid"
        EXPIRED = "EXPIRED", "Expired"

    school = models.OneToOneField(School, on_delete=models.CASCADE, related_name="subscription")
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE_TRIAL)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()

    class Meta:
        db_table = "cms_schoolsubscription"

    def __str__(self):
        return f"{self.school.school_name} - {self.status}"


# Post-save signal to auto-create a 90-day free trial subscription for new schools
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta

@receiver(post_save, sender=School)
def create_school_trial_subscription(sender, instance, created, **kwargs):
    if created:
        trial_plan, _ = SubscriptionPlan.objects.get_or_create(
            name="90-Day Free Trial Plan",
            defaults={
                "duration_days": 90,
                "max_students": 100,
                "price": 0.00
            }
        )
        end_date = timezone.now() + timedelta(days=90)
        SchoolSubscription.objects.create(
            school=instance,
            plan=trial_plan,
            status=SchoolSubscription.Status.ACTIVE_TRIAL,
            end_date=end_date
        )


class SchoolAdminProfile(models.Model):
    profile_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="school_admin_profile",
    )
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cms_schooladminprofile"

    def __str__(self):
        return f"{self.user.username} - {self.school.school_name}"


class PublishContent(models.Model):
    publish_id = models.AutoField(primary_key=True)
    release_name = models.CharField(max_length=150)
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE)
    total_experiences = models.IntegerField(default=0)
    status = models.CharField(max_length=50, default="DRAFT")
    export_file = models.CharField(max_length=255, null=True, blank=True)
    checksum = models.CharField(max_length=64, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cms_publishcontent"
        ordering = ["-created_at"]

    def __str__(self):
        return self.release_name
