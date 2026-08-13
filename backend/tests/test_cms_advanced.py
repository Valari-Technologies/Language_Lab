"""
Advanced CMS production-readiness tests.

1. RBAC          — unauthenticated/unauthorized users cannot write CMS content
                    or trigger package operations; content creators can.
2. Validation    — invalid/incomplete Screen payloads return HTTP 400 with a
                    descriptive, field-level error message.
3. Package Export — the publish pipeline bundles every screen and every
                    referenced media asset into the .elab archive with no
                    missing/broken references.
"""
import os

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from content_studio.models import Screen, Media, PublishVersion

pytestmark = pytest.mark.django_db

FAKE_WAV_BYTES = b"RIFF" + b"\x00\x00\x00\x00" + b"WAVEfmt " + b"\x00" * 16
FAKE_PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32


# ─────────────────────────────────────────────────────────────────────────
# 1. RBAC — Role-Based Access Control
# ─────────────────────────────────────────────────────────────────────────

class TestScreenRBAC:
    """Only CONTENT_CREATOR (or superuser) may write Screens; nobody else may,
    and unauthenticated requests are rejected outright."""

    def _screen_payload(self, activity):
        return {
            "activity": activity.id,
            "title": "RBAC Test Screen",
            "screen_type": Screen.ScreenType.INFORMATION,
            "estimated_duration": 30,
            "content": {"text": "hello"},
        }

    def test_unauthenticated_user_cannot_create_screen(self, api_client, activity):
        response = api_client.post(reverse("screen-list"), self._screen_payload(activity), format="json")
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
        assert Screen.objects.count() == 0

    @pytest.mark.parametrize("role_fixture", ["teacher_user", "school_admin_user", "student_user"])
    def test_other_roles_cannot_create_screen(self, api_client, activity, role_fixture, request):
        user = request.getfixturevalue(role_fixture)
        api_client.force_authenticate(user=user)

        response = api_client.post(reverse("screen-list"), self._screen_payload(activity), format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Screen.objects.count() == 0

    @pytest.mark.parametrize("role_fixture", ["teacher_user", "school_admin_user", "student_user"])
    def test_other_roles_cannot_edit_or_delete_screen(self, api_client, activity, role_fixture, request):
        screen = Screen.objects.create(
            activity=activity, title="Existing Screen", screen_type=Screen.ScreenType.INFORMATION,
            display_order=1, content={"text": "original"}, estimated_duration=30,
        )
        user = request.getfixturevalue(role_fixture)
        api_client.force_authenticate(user=user)

        update_response = api_client.patch(
            reverse("screen-detail", args=[screen.id]), {"title": "Hacked Title"}, format="json"
        )
        delete_response = api_client.delete(reverse("screen-detail", args=[screen.id]))

        assert update_response.status_code == status.HTTP_403_FORBIDDEN
        assert delete_response.status_code == status.HTTP_403_FORBIDDEN
        screen.refresh_from_db()
        assert screen.title == "Existing Screen"
        assert Screen.objects.filter(id=screen.id).exists()

    def test_content_creator_can_create_update_and_delete_screen(self, authenticated_client, activity):
        # Create
        create_response = authenticated_client.post(
            reverse("screen-list"), self._screen_payload(activity), format="json"
        )
        assert create_response.status_code == status.HTTP_201_CREATED, create_response.data
        screen_id = create_response.data["id"]

        # Update
        update_response = authenticated_client.patch(
            reverse("screen-detail", args=[screen_id]), {"title": "Updated Title"}, format="json"
        )
        assert update_response.status_code == status.HTTP_200_OK, update_response.data
        assert Screen.objects.get(id=screen_id).title == "Updated Title"

        # Delete
        delete_response = authenticated_client.delete(reverse("screen-detail", args=[screen_id]))
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT
        assert not Screen.objects.filter(id=screen_id).exists()


class TestPackageRBAC:
    """Publish / regenerate / package metadata require CONTENT_CREATOR; only the
    actual .elab file download is intentionally public (for the LMS player)."""

    def test_unauthenticated_user_cannot_trigger_publish(self, api_client, experience):
        response = api_client.post(reverse("publish-experience", args=[experience.id]), {}, format="json")
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    def test_other_role_cannot_trigger_publish(self, api_client, experience, teacher_user):
        api_client.force_authenticate(user=teacher_user)
        response = api_client.post(reverse("publish-experience", args=[experience.id]), {}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_other_role_cannot_regenerate_package(self, api_client, teacher_user):
        api_client.force_authenticate(user=teacher_user)
        response = api_client.post(reverse("package-regenerate", args=[999]), {}, format="json")
        # Must be blocked by permissions before it ever reaches the "not found" branch.
        assert response.status_code == status.HTTP_403_FORBIDDEN


# ─────────────────────────────────────────────────────────────────────────
# 2. Error Handling & Validation
# ─────────────────────────────────────────────────────────────────────────

class TestScreenValidationErrors:
    """Invalid or incomplete Screen payloads must return HTTP 400 with a
    descriptive, field-level error message — never a 500 or a silent failure."""

    def test_missing_title_returns_400_with_descriptive_message(self, authenticated_client, activity):
        payload = {
            "activity": activity.id,
            "screen_type": Screen.ScreenType.INFORMATION,
            "estimated_duration": 30,
            "content": {"text": "hello"},
            # "title" intentionally omitted
        }
        response = authenticated_client.post(reverse("screen-list"), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "title" in response.data
        assert "required" in str(response.data["title"]).lower()
        assert Screen.objects.count() == 0

    def test_missing_activity_returns_400_with_descriptive_message(self, authenticated_client):
        payload = {
            "title": "Orphan Screen",
            "screen_type": Screen.ScreenType.INFORMATION,
            "estimated_duration": 30,
            "content": {"text": "hello"},
            # "activity" intentionally omitted
        }
        response = authenticated_client.post(reverse("screen-list"), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "activity" in response.data
        assert "required" in str(response.data["activity"]).lower()
        assert Screen.objects.count() == 0

    def test_missing_estimated_duration_returns_400(self, authenticated_client, activity):
        payload = {
            "activity": activity.id,
            "title": "No Duration Screen",
            "screen_type": Screen.ScreenType.INFORMATION,
            "content": {"text": "hello"},
            # "estimated_duration" intentionally omitted
        }
        response = authenticated_client.post(reverse("screen-list"), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "estimated_duration" in response.data
        assert Screen.objects.count() == 0

    def test_invalid_content_type_structure_returns_400(self, authenticated_client, activity):
        """`content` must be a JSON object/dict — a bare string/list must be rejected, not truncated."""
        payload = {
            "activity": activity.id,
            "title": "Bad Content Screen",
            "screen_type": Screen.ScreenType.INFORMATION,
            "estimated_duration": 30,
            "content": "this is not a dictionary",
        }
        response = authenticated_client.post(reverse("screen-list"), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "content" in response.data
        assert "dictionary" in str(response.data["content"]).lower() or "object" in str(response.data["content"]).lower()
        assert Screen.objects.count() == 0

    def test_invalid_screen_type_choice_returns_400(self, authenticated_client, activity):
        payload = {
            "activity": activity.id,
            "title": "Bad Type Screen",
            "screen_type": "NOT_A_REAL_TYPE",
            "estimated_duration": 30,
            "content": {"text": "hello"},
        }
        response = authenticated_client.post(reverse("screen-list"), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "screen_type" in response.data
        assert Screen.objects.count() == 0

    def test_nonexistent_activity_id_returns_400_not_500(self, authenticated_client):
        payload = {
            "activity": 999999,
            "title": "Ghost Activity Screen",
            "screen_type": Screen.ScreenType.INFORMATION,
            "estimated_duration": 30,
            "content": {"text": "hello"},
        }
        response = authenticated_client.post(reverse("screen-list"), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "activity" in response.data
        assert Screen.objects.count() == 0


# ─────────────────────────────────────────────────────────────────────────
# 3. Package Export Validation
# ─────────────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def isolated_media_and_packages_root(settings, tmp_path):
    """Keep publish-pipeline output (media + .elab packages) out of the real media/ dir."""
    settings.MEDIA_ROOT = str(tmp_path)
    return tmp_path


@pytest.fixture
def uploaded_image_media(authenticated_client):
    """A real Media row backed by an actual file on disk, via the same upload
    endpoint production uploads go through."""
    image_file = SimpleUploadedFile("lesson_photo.png", FAKE_PNG_BYTES, content_type="image/png")
    response = authenticated_client.post(
        reverse("media-upload"), {"file": image_file, "folder": "lesson-images"}, format="multipart"
    )
    assert response.status_code == status.HTTP_201_CREATED, response.data
    return Media.objects.get(id=response.data["id"])


class TestPackageExportBundlesScreensAndMedia:
    def test_publish_bundles_all_screens_and_media_with_no_missing_references(
        self, authenticated_client, experience, activity, uploaded_image_media
    ):
        # Screen 1: an information screen with dialogue content.
        Screen.objects.create(
            activity=activity,
            title="Welcome Screen",
            screen_type=Screen.ScreenType.INFORMATION,
            display_order=1,
            content={"steps": [{"step": 1, "name": "Ben", "text": "Hello!", "side": "left"}]},
            estimated_duration=30,
        )
        # Screen 2: an image screen that references the uploaded media asset by ID,
        # exactly how the CMS front-end wires an "image_id" into screen content.
        Screen.objects.create(
            activity=activity,
            title="Lesson Photo Screen",
            screen_type=Screen.ScreenType.IMAGE,
            display_order=2,
            content={"image_id": uploaded_image_media.id, "text": "A classroom photo"},
            estimated_duration=20,
        )

        publish_response = authenticated_client.post(
            reverse("publish-experience", args=[experience.id]),
            {"version": "1.0", "release_notes": "Initial automated test build"},
            format="json",
        )
        assert publish_response.status_code == status.HTTP_201_CREATED, publish_response.data
        version_id = publish_response.data["version_id"]

        version = PublishVersion.objects.get(id=version_id)
        assert version.file_path and os.path.exists(version.file_path), "The .elab file must exist on disk"

        # Inspect the archive contents via the dedicated preview-json endpoint,
        # the same inspection path a content creator/QA engineer would use.
        preview_response = authenticated_client.get(reverse("package-preview-json", args=[version_id]))
        assert preview_response.status_code == status.HTTP_200_OK, preview_response.data

        files_in_archive = preview_response.data["files_in_archive"]
        assert "experience.json" in files_in_archive
        assert "manifest.json" in files_in_archive
        assert "metadata.json" in files_in_archive

        # The uploaded image must have been physically copied into assets/images/.
        image_asset_entries = [f for f in files_in_archive if f.startswith("assets/images/")]
        assert len(image_asset_entries) == 1, f"expected exactly one bundled image asset, got {files_in_archive}"
        bundled_filename = os.path.basename(image_asset_entries[0])
        assert bundled_filename == os.path.basename(uploaded_image_media.file.name)

        # The experience.json (Runtime v1.0 contract) must contain both screens,
        # in order, with no broken media references. Note: the runtime contract
        # uses camelCase "resolvedMedia" (see runtime_contact.py), distinct from
        # the internal preview payload's snake_case "resolved_media".
        experience_json = preview_response.data["experience"]
        screens = experience_json["activities"][0]["screens"]
        assert len(screens) == 2
        assert [s["title"] for s in screens] == ["Welcome Screen", "Lesson Photo Screen"]

        for screen in screens:
            for media_ref in screen.get("resolvedMedia", []):
                assert media_ref["missing"] is False, f"Screen '{screen['title']}' has a broken media reference: {media_ref}"

        # The image screen's resolved media URL must point at the rewritten, packaged asset path.
        image_screen = screens[1]
        resolved_urls = [m["url"] for m in image_screen["resolvedMedia"]]
        assert any(image_asset_entries[0] in url for url in resolved_urls), (
            f"expected the packaged asset path {image_asset_entries[0]!r} inside {resolved_urls}"
        )

    def test_publish_fails_validation_when_screen_references_deleted_media(
        self, authenticated_client, experience, activity
    ):
        """A screen referencing a media_id that doesn't exist must block publishing
        (validation gate), rather than silently shipping a broken package."""
        Screen.objects.create(
            activity=activity,
            title="Broken Reference Screen",
            screen_type=Screen.ScreenType.IMAGE,
            display_order=1,
            content={"image_id": 999999},
            estimated_duration=20,
        )

        publish_response = authenticated_client.post(
            reverse("publish-experience", args=[experience.id]), {}, format="json"
        )

        assert publish_response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert publish_response.data["validation_report"]["status"] == "FAILED"
        assert PublishVersion.objects.count() == 0

    def test_package_download_endpoint_is_publicly_accessible_and_streams_file(
        self, authenticated_client, experience, activity
    ):
        Screen.objects.create(
            activity=activity, title="Solo Screen", screen_type=Screen.ScreenType.INFORMATION,
            display_order=1, content={"text": "hi"}, estimated_duration=10,
        )
        publish_response = authenticated_client.post(
            reverse("publish-experience", args=[experience.id]), {"version": "1.0"}, format="json"
        )
        assert publish_response.status_code == status.HTTP_201_CREATED, publish_response.data
        version_id = publish_response.data["version_id"]

        # Download is deliberately AllowAny (the LMS Electron player has no user session),
        # so an entirely unauthenticated client must still be able to fetch it.
        anonymous_client = APIClient()
        download_response = anonymous_client.get(reverse("package-download", args=[version_id]))

        assert download_response.status_code == status.HTTP_200_OK
        assert download_response["Content-Type"] == "application/zip"
        assert ".zip" in download_response["Content-Disposition"]
        assert download_response["X-Checksum-SHA256"]
