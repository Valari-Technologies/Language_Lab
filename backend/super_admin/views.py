from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.views import APIView
import uuid
from datetime import timedelta
from django.db import transaction

from accounts.permissions import IsSuperAdmin, IsSuperAdminOrReadOnlyStaff
from accounts.scoping import filter_queryset_by_school
from .models import Grade, School, SchoolAdminProfile, PublishContent, License, LmsServer
from .serializers import (
    GradeDetailSerializer,
    GradeSerializer,
    SchoolAdminSerializer,
    SchoolSerializer,
    PublishContentSerializer,
)

User = get_user_model()


class CMSBaseViewSet(viewsets.ModelViewSet):
    filter_backends = [SearchFilter, OrderingFilter]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def get_model_name(self):
        model = getattr(self, "model", None)
        if not model:
            queryset = getattr(self, "queryset", None)
            if queryset is not None:
                model = queryset.model
            else:
                model = self.get_queryset().model
        return model._meta.verbose_name.title() if model else "Object"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                "message": f"{self.get_model_name()} created successfully",
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, "_prefetched_objects_cache", None):
            instance._prefetched_objects_cache = {}

        return Response(
            {
                "message": f"{self.get_model_name()} updated successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": f"{self.get_model_name()} deleted successfully"},
            status=status.HTTP_200_OK
        )


class GradeViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdminOrReadOnlyStaff]
    queryset = Grade.objects.all()
    search_fields = ["grade_name", "description"]
    ordering_fields = ["sort_order", "grade_name", "created_at"]
    ordering = ["sort_order"]

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return GradeDetailSerializer
        return GradeSerializer


class SchoolViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdminOrReadOnlyStaff]
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    search_fields = ["school_name"]

    def get_queryset(self):
        return filter_queryset_by_school(School.objects.all(), self.request.user, school_field="school_id")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        admin_user = instance.schoolAdminId
        with transaction.atomic():
            instance.delete()
            if admin_user:
                admin_user.delete()
        return Response(
            {"message": "School and associated admin deleted successfully"},
            status=status.HTTP_200_OK
        )

    def create(self, request, *args, **kwargs):
        data = request.data
        school_name = data.get("school_name") or data.get("name")
        if not school_name:
            return Response({"error": "School name is required."}, status=status.HTTP_400_BAD_REQUEST)

        address = data.get("address", "")
        phone = data.get("phone", "")
        lan_phone = data.get("lan_phone") or data.get("lan") or ""
        school_code = data.get("school_code") or ""
        contact_email = data.get("contactEmail") or data.get("email") or ""
        if contact_email:
            if School.objects.filter(email=contact_email).exists() or School.objects.filter(contactEmail=contact_email).exists():
                return Response({"error": "A school with this email address already registered."}, status=status.HTTP_400_BAD_REQUEST)
        
        admin_name = data.get("admin_name") or data.get("admin_full_name") or "School Admin"
        admin_username = data.get("admin_username")
        admin_email = data.get("admin_email") or contact_email
        admin_password = data.get("admin_password")
        
        max_servers = int(data.get("maxLmsServers", 2))
        concurrent_users = int(data.get("concurrentUsersPerServer", 40))
        duration = data.get("licenseDuration", "1 Year")
        
        issue_date = timezone.now().date()
        if duration == "1 Year":
            expiry_date = issue_date + timedelta(days=365)
        elif duration == "2 Years":
            expiry_date = issue_date + timedelta(days=730)
        else:
            expiry_str = data.get("expiryDate")
            if expiry_str:
                try:
                    expiry_date = timezone.datetime.strptime(expiry_str, "%Y-%m-%d").date()
                except Exception:
                    expiry_date = issue_date + timedelta(days=365)
            else:
                expiry_date = issue_date + timedelta(days=365)

        if not admin_username:
            admin_username = f"admin_{uuid.uuid4().hex[:6]}"
        if User.objects.filter(username=admin_username).exists():
            return Response({"error": "Admin username already exists."}, status=status.HTTP_400_BAD_REQUEST)
        if admin_email and User.objects.filter(email=admin_email).exists():
            return Response({"error": "A user with this email address already registered."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            sch_id_str = "SCH-" + uuid.uuid4().hex[:8].upper()
            if not school_code:
                school_code = sch_id_str
            school = School.objects.create(
                schoolId=sch_id_str,
                school_code=school_code,
                school_name=school_name,
                address=address,
                phone=phone,
                lan_phone=lan_phone,
                email=contact_email,
                contactEmail=contact_email,
                is_active=True
            )
            
            admin_user = User.objects.create_user(
                username=admin_username,
                email=admin_email,
                full_name=admin_name,
                role=User.Role.SCHOOL_ADMIN,
                password=admin_password
            )
            
            school.schoolAdminId = admin_user
            
            lic_id_str = "LIC-" + uuid.uuid4().hex[:12].upper()
            lic_key_str = "KEY-" + uuid.uuid4().hex[:16].upper()
            license_obj = License.objects.create(
                licenseId=lic_id_str,
                licenseKey=lic_key_str,
                school=school,
                maxLmsServers=max_servers,
                concurrentUsersPerServer=concurrent_users,
                expiryDate=expiry_date,
                status=License.Status.ACTIVE
            )
            
            school.licenseId = license_obj
            school.save()
            
            SchoolAdminProfile.objects.create(
                user=admin_user,
                school=school
            )

        # Dispatch welcome email with credentials to recipient
        recipient = admin_email or contact_email
        if recipient and admin_password:
            try:
                from django.core.mail import send_mail
                from django.conf import settings
                subject = f"Welcome to Language Lab - Credentials for {school_name}"
                message = f"""Hello {admin_name},

Your School Admin account for '{school_name}' has been created successfully.

Here are your account credentials:
--------------------------------------------
School Code: {school_code}
Username: {admin_username}
Password: {admin_password}
--------------------------------------------

Please use these credentials to sign in to the Language Lab CMS portal.

Best regards,
Language Lab Team
"""
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@languagelab.com"),
                    recipient_list=[recipient],
                    fail_silently=True,
                )
            except Exception as mail_err:
                pass
            
        serializer = self.get_serializer(school)
        return Response(
            {
                "message": "School and License created successfully",
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            instance = self.get_object()
            new_email = request.data.get("email") or request.data.get("contactEmail")
            if new_email:
                instance.email = new_email
                instance.contactEmail = new_email
                instance.save()
                if instance.schoolAdminId:
                    instance.schoolAdminId.email = new_email
                    instance.schoolAdminId.save(update_fields=["email"])
            serializer = self.get_serializer(instance)
            return Response({"message": "School updated successfully", "data": serializer.data}, status=status.HTTP_200_OK)
        return response



class ActivateServerAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        license_key = request.data.get("licenseKey")
        server_name = request.data.get("serverName")
        installation_identity = request.data.get("installationIdentity")

        if not license_key or not server_name or not installation_identity:
            return Response({"error": "licenseKey, serverName, and installationIdentity are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            license_obj = License.objects.select_related('school').get(licenseKey=license_key)
        except License.DoesNotExist:
            return Response({"error": "Invalid License Key."}, status=status.HTTP_400_BAD_REQUEST)

        if license_obj.status != License.Status.ACTIVE:
            return Response({"error": f"License is not active. Status: {license_obj.status}"}, status=status.HTTP_400_BAD_REQUEST)

        if license_obj.expiryDate < timezone.now().date():
            license_obj.status = License.Status.EXPIRED
            license_obj.save()
            return Response({"error": "License has expired."}, status=status.HTTP_400_BAD_REQUEST)

        active_servers = LmsServer.objects.filter(license=license_obj, status=LmsServer.Status.ACTIVE)
        existing_server = active_servers.filter(installationId=installation_identity).first()
        if not existing_server:
            if active_servers.count() >= license_obj.maxLmsServers:
                return Response({"error": "Maximum registered LMS servers capacity reached for this license."}, status=status.HTTP_400_BAD_REQUEST)
            
            server_obj = LmsServer.objects.create(
                installationId=installation_identity,
                serverName=server_name,
                school=license_obj.school,
                license=license_obj,
                status=LmsServer.Status.ACTIVE,
                lastSyncTime=timezone.now()
            )
        else:
            existing_server.serverName = server_name
            existing_server.lastSyncTime = timezone.now()
            existing_server.save()
            server_obj = existing_server

        return Response({
            "status": "success",
            "message": "Server activated successfully.",
            "installationId": server_obj.installationId,
            "maxLmsServers": license_obj.maxLmsServers,
            "concurrentUsersPerServer": license_obj.concurrentUsersPerServer,
            "expiryDate": str(license_obj.expiryDate)
        }, status=status.HTTP_200_OK)


class DeactivateServerAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        installation_id = request.data.get("installationId")
        if not installation_id:
            return Response({"error": "installationId is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            server = LmsServer.objects.get(installationId=installation_id)
        except LmsServer.DoesNotExist:
            return Response({"error": "LMS Server installation not found."}, status=status.HTTP_404_NOT_FOUND)

        server.status = LmsServer.Status.DEACTIVATED
        server.save()

        return Response({
            "status": "success",
            "message": f"Server '{server.serverName}' has been deactivated successfully."
        }, status=status.HTTP_200_OK)


class DashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        from content_studio.models import Experience, PublishedPackage
        total_exp = Experience.objects.count()
        draft_exp = Experience.objects.filter(status="DRAFT").count()
        published_exp = Experience.objects.filter(status="APPROVED").count()
        total_pkg = PublishedPackage.objects.count()

        return Response({
            "total_schools": School.objects.count(),
            "total_school_admins": User.objects.filter(role="SCHOOL_ADMIN").count(),
            "total_publish_contents": total_pkg,
            "total_grades": Grade.objects.count(),
            "total_experiences": total_exp,
            "draft_experiences": draft_exp,
            "published_experiences": published_exp,
            "recent_experiences": []
        }, status=status.HTTP_200_OK)


class SchoolAdminViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    queryset = User.objects.filter(role="SCHOOL_ADMIN").select_related("school_admin_profile__school")
    serializer_class = SchoolAdminSerializer
    search_fields = ["username", "email", "full_name"]

    def get_queryset(self):
        return User.objects.filter(role="SCHOOL_ADMIN").select_related("school_admin_profile__school")

    def perform_destroy(self, instance):
        SchoolAdminProfile.objects.filter(user=instance).delete()
        super().perform_destroy(instance)


class PublishContentViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdminOrReadOnlyStaff]
    queryset = PublishContent.objects.all()
    serializer_class = PublishContentSerializer
    search_fields = ["release_name", "checksum"]
