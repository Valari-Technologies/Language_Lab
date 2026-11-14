from django.db.models import Q
from django.utils import timezone

from super_admin.models import School, License, LmsServer


def get_registered_hub(request):
    """
    Identify a registered school hub from the headers the LMS sends at sync:
    X-School-ID, X-License-ID, X-Installation-ID.
    Returns (school, server) only for an ACTIVE LmsServer of the school's ACTIVE,
    non-expired licence; otherwise (None, None).
    """
    school_id = str(request.headers.get("X-School-ID") or "").strip()
    license_id = str(request.headers.get("X-License-ID") or "").strip()
    installation_id = str(request.headers.get("X-Installation-ID") or "").strip()
    if not (school_id and license_id and installation_id):
        return None, None

    school_query = Q(schoolId__iexact=school_id)
    if school_id.isdigit():
        school_query |= Q(school_id=int(school_id))
    school = School.objects.filter(school_query, is_active=True).first()
    if not school:
        return None, None

    server = (
        LmsServer.objects.select_related("license")
        .filter(
            installationId=installation_id,
            school=school,
            status=LmsServer.Status.ACTIVE,
            license__licenseId=license_id,
            license__school=school,
        )
        .first()
    )
    if not server:
        return None, None

    license_obj = server.license
    if license_obj.status != License.Status.ACTIVE:
        return None, None
    if license_obj.expiryDate is None or license_obj.expiryDate < timezone.now().date():
        return None, None
    return school, server
