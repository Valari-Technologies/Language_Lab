from django.utils import timezone
from django.http import JsonResponse
from super_admin.models import SchoolSubscription
from accounts.scoping import get_user_school

class SubscriptionEnforcementMiddleware:
    """
    Middleware that enforces active school subscription for Content Studio
    and LMS sync operations.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        # Target Content Studio (/api/v1/) and LMS endpoints (/api/lms/, /api/v1/lms/)
        if path.startswith('/api/v1/content/') or path.startswith('/api/lms/') or path.startswith('/api/v1/lms/'):
            user = request.user
            if user and user.is_authenticated:
                # Bypass enforcement for global super admin
                if user.role == "SUPER_ADMIN" or user.is_superuser:
                    return self.get_response(request)

                school = get_user_school(user)
                if school:
                    subscription = getattr(school, 'subscription', None)
                    if not subscription:
                        return JsonResponse(
                            {"error": "Payment Required: No active subscription plan found for your school."},
                            status=402
                        )
                    
                    if subscription.status == SchoolSubscription.Status.EXPIRED or subscription.end_date < timezone.now():
                        # Explicitly mark status as expired if date has passed
                        if subscription.status != SchoolSubscription.Status.EXPIRED:
                            subscription.status = SchoolSubscription.Status.EXPIRED
                            subscription.save()
                        return JsonResponse(
                            {"error": "Payment Required: Your school's subscription has expired."},
                            status=402
                        )

        return self.get_response(request)
