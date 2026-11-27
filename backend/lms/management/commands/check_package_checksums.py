import hashlib
import os

from django.core.management.base import BaseCommand

from content_studio.models import PublishVersion
from lms.packages.views import build_level_map, resolve_grade
from super_admin.models import School
from teacher.models import Student


def _sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


class Command(BaseCommand):
    help = (
        "READ ONLY. For every package in any school's level map, compare the SHA-256 of the latest "
        "PublishVersion file with its stored checksum and list missing files and mismatches."
    )

    def handle(self, *args, **options):
        grades = {}
        for school in School.objects.filter(is_active=True):
            for student in Student.objects.filter(school=school, user__is_active=True):
                grade = resolve_grade(student)
                if grade:
                    grades[grade.id] = grade

        package_ids = set()
        for grade in grades.values():
            level_map = build_level_map(grade)
            for entry in level_map["lessons"] + level_map["bosses"]:
                if entry:
                    package_ids.add(int(entry["packageId"]))

        ok, missing, mismatches = 0, [], []
        for pid in sorted(package_ids):
            version = (
                PublishVersion.objects.filter(published_package_id=pid)
                .order_by("-published_at", "-id")
                .first()
            )
            path = version.file_path or ""
            if not path or not os.path.isfile(path):
                missing.append((pid, version.id, path))
                continue
            real = _sha256(path)
            if real != (version.checksum or ""):
                mismatches.append((pid, version.id, version.checksum or "", real, path))
            else:
                ok += 1

        self.stdout.write(f"Packages in level maps: {len(package_ids)} | OK: {ok} | "
                          f"missing file: {len(missing)} | checksum mismatch: {len(mismatches)}")
        for pid, vid, path in missing:
            self.stdout.write(f"MISSING  package={pid} version={vid} path={path or '(empty)'}")
        for pid, vid, stored, real, path in mismatches:
            self.stdout.write(f"MISMATCH package={pid} version={vid} stored={stored} real={real} path={path}")
