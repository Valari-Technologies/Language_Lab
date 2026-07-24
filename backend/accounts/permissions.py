from rest_framework.permissions import SAFE_METHODS, BasePermission


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


class IsSuperAdminOrReadOnlyStaff(BasePermission):
    """Super Admin: full access. School Admin / Teacher / Content Creator: read-only."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.role == "SUPER_ADMIN" or user.is_superuser:
            return True
        if request.method in SAFE_METHODS and user.role in ("SCHOOL_ADMIN", "TEACHER", "CONTENT_CREATOR"):
            return True
        return False


class IsSuperAdminOrSchoolAdminWrite(BasePermission):
    """Super Admin: full access. School Admin: write. Teacher: read-only."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.role == "SUPER_ADMIN" or user.is_superuser:
            return True
        if user.role == "SCHOOL_ADMIN":
            return True
        if request.method in SAFE_METHODS and user.role == "TEACHER":
            return True
        return False


class IsContentCreator(BasePermission):
    """
    Permission class that grants access only to users with role 'CONTENT_CREATOR'.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, "role", None) == "CONTENT_CREATOR"
        )


class IsContentCreatorOrSuperAdmin(BasePermission):
    """
    Permission class that grants access to 'CONTENT_CREATOR' users,
    or django superusers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (getattr(request.user, "role", None) in ["CONTENT_CREATOR"] or request.user.is_superuser)
        )

