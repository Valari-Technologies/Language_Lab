"""
CMS Test 3 — Media asset file path generation for uploaded audio clips.

Verifies that uploading an audio file through /api/v1/content/media/upload/:
  * is accepted (passes the extension/MIME/magic-byte security checks),
  * is physically written to disk under the `media_library/` folder,
  * gets a randomized, collision-safe stored filename (not the raw upload name),
  * has a Media record whose `file`/`url`/`stored_filename` fields all agree
    with where the file actually landed on disk.
"""
import os

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status

from content_studio.models import Media

pytestmark = pytest.mark.django_db

# Minimal-but-valid WAV file bytes: "RIFF" + 4-byte size + "WAVE", which is
# exactly what validate_file_security() checks for (RIFF header containing
# "WAVE" within the first 16 bytes). Real player compatibility isn't the
# point here — passing the same magic-byte gate production uploads go through is.
FAKE_WAV_BYTES = b"RIFF" + b"\x00\x00\x00\x00" + b"WAVEfmt " + b"\x00" * 16


@pytest.fixture(autouse=True)
def isolated_media_root(settings, tmp_path):
    """Redirect uploads to a throwaway directory so tests never touch real media/."""
    settings.MEDIA_ROOT = str(tmp_path)
    return tmp_path


def _upload_audio(client, filename="greeting_clip.wav"):
    audio_file = SimpleUploadedFile(filename, FAKE_WAV_BYTES, content_type="audio/wav")
    url = reverse("media-upload")
    return client.post(url, {"file": audio_file, "folder": "audio-clips"}, format="multipart")


class TestMediaAudioFilePathGeneration:
    def test_audio_upload_returns_201_and_creates_media_record(self, authenticated_client):
        response = _upload_audio(authenticated_client)

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["media_type"] == "AUDIO"

        media = Media.objects.get(id=response.data["id"])
        assert media.media_type == "AUDIO"
        assert media.original_filename == "greeting_clip.wav"

    def test_stored_filename_is_randomized_not_the_raw_upload_name(self, authenticated_client):
        response = _upload_audio(authenticated_client)
        media = Media.objects.get(id=response.data["id"])

        # The stored filename must NOT be the literal uploaded name (that would
        # allow path-collision / overwrite attacks) but must preserve the extension.
        assert media.stored_filename != "greeting_clip.wav"
        assert media.stored_filename.endswith(".wav")
        assert len(media.stored_filename.split(".")[0]) == 32, "expected a uuid4().hex-based name"

    def test_file_path_is_generated_under_media_library_folder(self, authenticated_client, isolated_media_root):
        response = _upload_audio(authenticated_client)
        media = Media.objects.get(id=response.data["id"])

        # The DB-stored relative path must live under media_library/.
        assert media.file.name.startswith("media_library/")
        assert media.file.name.endswith(".wav")

        # And the file must actually exist on disk at that exact relative path.
        absolute_path = os.path.join(str(isolated_media_root), media.file.name)
        assert os.path.isfile(absolute_path), f"expected uploaded file at {absolute_path}"
        with open(absolute_path, "rb") as f:
            assert f.read() == FAKE_WAV_BYTES

    def test_url_field_is_consistent_with_stored_file_path(self, authenticated_client):
        response = _upload_audio(authenticated_client)
        media = Media.objects.get(id=response.data["id"])

        assert media.file.name in media.url, "url field should point at the same stored file path"
        assert media.url == response.data["url"]

    def test_rejects_audio_upload_with_disallowed_extension(self, authenticated_client):
        bad_file = SimpleUploadedFile("clip.exe", FAKE_WAV_BYTES, content_type="audio/wav")
        url = reverse("media-upload")
        response = authenticated_client.post(url, {"file": bad_file}, format="multipart")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Media.objects.count() == 0
