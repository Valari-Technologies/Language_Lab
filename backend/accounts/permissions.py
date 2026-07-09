from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """
    Permission class that grants access only to users with role 'SUPER_ADMIN' 
    or django superusers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (getattr(request.user, "role", None) == "SUPER_ADMIN" or request.user.is_superuser)
        )


class IsInstituteAdmin(BasePermission):
    """
    Permission class that grants access only to users with role 'SCHOOL_ADMIN'.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, "role", None) == "SCHOOL_ADMIN"
        )


class IsTeacher(BasePermission):
    """
    Permission class that grants access only to users with role 'TEACHER'.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, "role", None) == "TEACHER"
        )


class IsStudent(BasePermission):
    """
    Permission class that grants access only to users with role 'STUDENT'.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, "role", None) == "STUDENT"
        )


class IsAdminRole(BasePermission):
    """
    Permission class that grants access to either 'SUPER_ADMIN' or 'SCHOOL_ADMIN' users,
    or django superusers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (getattr(request.user, "role", None) in ["SUPER_ADMIN", "SCHOOL_ADMIN"] or request.user.is_superuser)
        )


class IsTeacherOrAdmin(BasePermission):
    """
    Permission class that grants access to 'SUPER_ADMIN', 'SCHOOL_ADMIN', or 'TEACHER' users,
    or django superusers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (getattr(request.user, "role", None) in ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"] or request.user.is_superuser)
        )
