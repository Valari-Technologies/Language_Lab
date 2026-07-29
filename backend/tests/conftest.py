"""
Shared pytest fixtures for the CMS (content_studio) automation test suite.

These fixtures build the minimal object graph a Screen needs to exist:
User (CONTENT_CREATOR) -> Grade -> Experience -> Activity -> Screen.
"""
import pytest
from rest_framework.test import APIClient

from super_admin.models import Grade
from content_studio.models import Experience, Activity


@pytest.fixture
def api_client():
    """A plain DRF APIClient with no authentication applied yet."""
    return APIClient()


@pytest.fixture
def content_creator(db, django_user_model):
    """A user with the CONTENT_CREATOR role, the only role allowed to write CMS content."""
    return django_user_model.objects.create_user(
        username="cms_creator",
        email="cms_creator@example.com",
        password="password123",
        role="CONTENT_CREATOR",
    )


@pytest.fixture
def authenticated_client(api_client, content_creator):
    """An APIClient force-authenticated as the content_creator fixture user."""
    api_client.force_authenticate(user=content_creator)
    return api_client


@pytest.fixture
def grade(db):
    return Grade.objects.create(grade_name="Grade 4", sort_order=4, description="Grade 4")


@pytest.fixture
def experience(db, grade, content_creator):
    return Experience.objects.create(
        title="Automated Test Experience",
        description="Created by the CMS pytest suite.",
        grade=grade,
        subject="English",
        language="English",
        difficulty=Experience.Difficulty.EASY,
        estimated_duration=15,
        status=Experience.Status.DRAFT,
        created_by=content_creator,
    )


@pytest.fixture
def activity(db, experience):
    return Activity.objects.create(
        experience=experience,
        title="Automated Test Activity",
        description="",
        learning_objective="",
        estimated_duration=10,
        mastery_threshold=80,
        display_order=1,
    )


# ── Additional roles for RBAC testing ──────────────────────────────────────

@pytest.fixture
def teacher_user(db, django_user_model):
    """A user with the TEACHER role — must NOT be able to write CMS content."""
    return django_user_model.objects.create_user(
        username="cms_teacher",
        email="cms_teacher@example.com",
        password="password123",
        role="TEACHER",
    )


@pytest.fixture
def school_admin_user(db, django_user_model):
    """A user with the SCHOOL_ADMIN role — must NOT be able to write CMS content."""
    return django_user_model.objects.create_user(
        username="cms_school_admin",
        email="cms_school_admin@example.com",
        password="password123",
        role="SCHOOL_ADMIN",
    )


@pytest.fixture
def student_user(db, django_user_model):
    """A user with the STUDENT role — must NOT be able to write CMS content."""
    return django_user_model.objects.create_user(
        username="cms_student",
        email="cms_student@example.com",
        password="password123",
        role="STUDENT",
    )
