"""Level plans and package files for the CMS LMS hub (built on the CMS level map)."""
import os
from urllib.parse import quote

from django.conf import settings
from django.http import FileResponse, HttpResponse
from django.utils import timezone

from content_studio.models import PublishedPackage, PublishVersion
from lms.packages.views import _grade_payload, build_level_map, resolve_grade
from teacher.models import Student
from .core import error, iso

# nginx serves package files from this internal location (frontend/nginx.conf); Django only checks access
ACCEL_PREFIX = "/_lmshub_packages/"


def _latest_version(package_id):
    return (
        PublishVersion.objects.filter(published_package_id=package_id)
        .order_by("-published_at", "-id")
        .first()
    )


def _file_ok(version):
    return bool(version and version.file_path and os.path.isfile(version.file_path))


def _hub_entry(entry):
    """A level-map entry with the download pointing at the CMS LMS hub, plus "available"."""
    if not entry:
        return None
    out = dict(entry)
    out["downloadUrl"] = f"/api/lms-hub/packages/{entry['packageId']}"
    out["available"] = _file_ok(_latest_version(int(entry["packageId"])))
    return out


def plan_for_grade(grade):
    level_map = build_level_map(grade)
    return {
        "grade": _grade_payload(grade),
        "generated_at": iso(timezone.now()),
        "counts": level_map["counts"],
        "lessons": [_hub_entry(e) for e in level_map["lessons"]],
        "bosses": [_hub_entry(e) for e in level_map["bosses"]],
    }


def plan_for_student(student):
    """(status, body) for GET level-plan: the hub's JSON shape."""
    grade = resolve_grade(student)
    if not grade:
        return 422, {"error": "grade_not_found", "raw": student.grade or ""}
    plan = plan_for_grade(grade)
    user = student.user
    return 200, {
        "student": {"id": student.student_id, "login_code": user.username, "name": user.full_name or user.username},
        **plan,
    }


def _package_ids(level_map):
    return {int(e["packageId"]) for e in level_map["lessons"] + level_map["bosses"] if e}


def package_ids_for_student(student):
    grade = resolve_grade(student)
    return _package_ids(build_level_map(grade)) if grade else set()


def school_grades(school):
    """Grades of the school's active students, by id."""
    grades = {}
    for student in Student.objects.filter(school=school, user__is_active=True):
        grade = resolve_grade(student)
        if grade:
            grades[grade.id] = grade
    return grades


def package_ids_for_school(school):
    ids = set()
    for grade in school_grades(school).values():
        ids |= _package_ids(build_level_map(grade))
    return ids


def package_id_for_slot(student, level_key):
    """Package of the student's plan for a map slot ("L7" / "B2"), or None."""
    grade = resolve_grade(student)
    if not grade:
        return None
    level_map = build_level_map(grade)
    slots = level_map["bosses"] if level_key[0] == "B" else level_map["lessons"]
    index = int(level_key[1:]) - 1
    entry = slots[index] if 0 <= index < len(slots) else None
    return entry["packageId"] if entry else None


def package_response(request, package_id, allowed_ids):
    """The .elab of a package the caller may have, or 404 package_not_available."""
    if not str(package_id).isdigit() or int(package_id) not in allowed_ids:
        return error(404, "package_not_available")
    pkg = PublishedPackage.objects.filter(id=int(package_id)).first()
    version = _latest_version(pkg.id) if pkg else None
    if not _file_ok(version):
        return error(404, "package_not_available")

    path = version.file_path
    headers = {
        "Content-Disposition": f'attachment; filename="{os.path.basename(path)}"',
        "X-Package-Checksum": version.checksum or "",
        "X-Package-Version": version.version_number or "",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
    }
    # Behind the production nginx (it sets X-Lmshub-Accel), nginx streams the file itself
    root = os.path.realpath(getattr(settings, "PACKAGES_ROOT", "") or "")
    real = os.path.realpath(path)
    try:
        inside_root = bool(root) and os.path.commonpath([root, real]) == root
    except ValueError:  # different drives (Windows)
        inside_root = False
    if request.headers.get("X-Lmshub-Accel") == "1" and inside_root:
        response = HttpResponse(content_type="application/octet-stream")
        response["X-Accel-Redirect"] = ACCEL_PREFIX + quote(os.path.relpath(real, root).replace(os.sep, "/"))
    else:
        response = FileResponse(open(path, "rb"), content_type="application/octet-stream")
    for name, value in headers.items():
        response[name] = value
    return response
