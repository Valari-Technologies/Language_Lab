from .models import School, SchoolAdminProfile, Teacher


def get_user_school(user):
    """Return the school a school admin or teacher belongs to, or None for super admins."""
    if not user or not user.is_authenticated:
        return None
    if user.role == "SUPER_ADMIN" or user.is_superuser:
        return None
    if user.role == "SCHOOL_ADMIN":
        profile = SchoolAdminProfile.objects.filter(user=user).select_related("school").first()
        return profile.school if profile else None
    if user.role == "TEACHER":
        teacher = Teacher.objects.filter(user=user).select_related("school").first()
        return teacher.school if teacher else None
    return None


def get_user_school_id(user):
    school = get_user_school(user)
    return school.school_id if school else None


def filter_queryset_by_school(queryset, user, school_field="school"):
    school = get_user_school(user)
    if school is None:
        if user.role == "SUPER_ADMIN" or user.is_superuser:
            return queryset
        return queryset.none()
    return queryset.filter(**{school_field: school})
