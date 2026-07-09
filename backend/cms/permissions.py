from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsSuperAdminOrReadOnlyStaff(BasePermission):
    """Super Admin: full access. School Admin / Teacher: read-only."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.role == "SUPER_ADMIN" or user.is_superuser:
            return True
        if request.method in SAFE_METHODS and user.role in ("SCHOOL_ADMIN", "TEACHER"):
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
