from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
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
    LmsServerSerializer,
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


def cleanup_stale_school_users(email):
    if not email:
        return
    for user in list(User.objects.filter(email=email)):
        has_admin_profile = SchoolAdminProfile.objects.filter(user=user, school__isnull=False).exists()
        has_school_admin_link = School.objects.filter(schoolAdminId=user).exists()
        try:
            from school_admin.models import Teacher
            has_teacher = Teacher.objects.filter(user=user, school__isnull=False).exists()
        except Exception:
            has_teacher = False
        try:
            from school_admin.models import Student
            has_student = Student.objects.filter(user=user, school__isnull=False).exists()
        except Exception:
            has_student = False

        if not (has_admin_profile or has_school_admin_link or has_teacher or has_student):
            user.delete()


class SchoolViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdminOrReadOnlyStaff]
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    search_fields = ["school_name"]

    def get_queryset(self):
        return filter_queryset_by_school(School.objects.all(), self.request.user, school_field="school_id")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        school_emails = {e for e in [instance.email, instance.contactEmail] if e}
        users_to_delete = set()
        if instance.schoolAdminId:
            users_to_delete.add(instance.schoolAdminId)

        for profile in SchoolAdminProfile.objects.filter(school=instance).select_related("user"):
            if profile.user:
                users_to_delete.add(profile.user)

        try:
            from school_admin.models import Teacher
            for teacher in Teacher.objects.filter(school=instance).select_related("user"):
                if teacher.user:
                    users_to_delete.add(teacher.user)
        except Exception:
            pass

        for email in school_emails:
            for u in User.objects.filter(email=email):
                users_to_delete.add(u)

        with transaction.atomic():
            school_name_copy = instance.school_name
            instance.delete()
            for user in users_to_delete:
                if User.objects.filter(pk=user.pk).exists():
                    user.delete()

            try:
                from super_admin.models import ActivityLog
                ActivityLog.objects.create(
                    activity_type="school_deleted",
                    message=f"School '{school_name_copy}' was deleted.",
                    user=request.user if request and request.user and request.user.is_authenticated else None
                )
            except Exception as e:
                print("Failed to create ActivityLog for school deletion:", e)

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
        academic_year = data.get("academic_year") or data.get("academicYear") or "2026-2027"
        school_code = data.get("school_code") or ""
        contact_email = data.get("contactEmail") or data.get("email") or ""
        admin_email = data.get("admin_email") or contact_email

        if contact_email:
            cleanup_stale_school_users(contact_email)
        if admin_email:
            cleanup_stale_school_users(admin_email)

        if phone:
            cleaned_phone = "".join(c for c in phone if c.isdigit())
            if len(cleaned_phone) != 10 or len(phone) != 10:
                return Response({"error": "Phone number must be exactly 10 numeric digits."}, status=status.HTTP_400_BAD_REQUEST)
        if contact_email:
            if School.objects.filter(email=contact_email).exists() or School.objects.filter(contactEmail=contact_email).exists():
                return Response({"error": "A school with this email address already registered."}, status=status.HTTP_400_BAD_REQUEST)
        
        admin_name = data.get("admin_name") or data.get("admin_full_name") or "School Admin"
        admin_username = data.get("admin_username")
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
                academic_year=academic_year,
                email=contact_email,
                contactEmail=contact_email,
                is_active=True
            )
            
            admin_user = User.objects.create_user(
                username=admin_username,
                email=admin_email,
                full_name=admin_name,
                role=User.Role.SCHOOL_ADMIN,
                password=admin_password,
                phone_no=phone
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
                licenseDuration=duration,
                status=License.Status.ACTIVE
            )
            
            school.licenseId = license_obj
            school.save()

            # Auto-generate initial LMS server installation license (40 users capacity)
            first_inst_id = "INST-" + uuid.uuid4().hex[:8].upper()
            first_lic_key = "LMS-KEY-" + uuid.uuid4().hex[:16].upper()
            LmsServer.objects.create(
                installationId=first_inst_id,
                serverName=f"{school_name} - Primary Server",
                licenseKey=first_lic_key,
                school=school,
                license=license_obj,
                status=LmsServer.Status.ACTIVE,
                maxUsers=concurrent_users or 40
            )
            
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
        new_phone = request.data.get("phone")
        if new_phone:
            cleaned_phone = "".join(c for c in new_phone if c.isdigit())
            if len(cleaned_phone) != 10 or len(new_phone) != 10:
                return Response({"error": "Phone number must be exactly 10 numeric digits."}, status=status.HTTP_400_BAD_REQUEST)

        response = super().update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            instance = self.get_object()
            new_email = request.data.get("email") or request.data.get("contactEmail")
            if new_phone and instance.schoolAdminId:
                instance.schoolAdminId.phone_no = new_phone
                instance.schoolAdminId.save(update_fields=["phone_no"])
            if new_email:
                instance.email = new_email
                instance.contactEmail = new_email
                instance.save()
                if instance.schoolAdminId:
                    instance.schoolAdminId.email = new_email
                    instance.schoolAdminId.save(update_fields=["email"])

            max_servers = request.data.get("maxLmsServers") or request.data.get("max_lms_servers")
            concurrent_users = request.data.get("concurrentUsersPerServer") or request.data.get("concurrent_users_per_server")
            duration = request.data.get("licenseDuration")
            expiry_str = request.data.get("expiryDate") or request.data.get("expiry_date")

            license_obj = getattr(instance, "school_license", None) or License.objects.filter(school=instance).first()
            if license_obj:
                update_fields = []
                if max_servers is not None:
                    try:
                        license_obj.maxLmsServers = int(max_servers)
                        update_fields.append("maxLmsServers")
                    except (ValueError, TypeError):
                        pass
                if concurrent_users is not None:
                    try:
                        license_obj.concurrentUsersPerServer = int(concurrent_users)
                        update_fields.append("concurrentUsersPerServer")
                    except (ValueError, TypeError):
                        pass

                if duration or expiry_str:
                    today = timezone.now().date()
                    if duration == "1 Year":
                        license_obj.expiryDate = today + timedelta(days=365)
                        license_obj.licenseDuration = "1 Year"
                        update_fields.extend(["expiryDate", "licenseDuration"])
                    elif duration == "2 Years":
                        license_obj.expiryDate = today + timedelta(days=730)
                        license_obj.licenseDuration = "2 Years"
                        update_fields.extend(["expiryDate", "licenseDuration"])
                    elif duration == "Custom" or expiry_str:
                        if expiry_str:
                            try:
                                license_obj.expiryDate = timezone.datetime.strptime(expiry_str, "%Y-%m-%d").date()
                                update_fields.append("expiryDate")
                            except Exception:
                                pass
                        license_obj.licenseDuration = "Custom"
                        update_fields.append("licenseDuration")

                if update_fields:
                    license_obj.save(update_fields=update_fields)

            # Ensure at least one primary LMS server exists with licenseKey and 40 users capacity
            if license_obj and not LmsServer.objects.filter(school=instance).exists():
                first_inst_id = "INST-" + uuid.uuid4().hex[:8].upper()
                first_lic_key = "LMS-KEY-" + uuid.uuid4().hex[:16].upper()
                LmsServer.objects.create(
                    installationId=first_inst_id,
                    serverName=f"{instance.school_name} - Primary Server",
                    school=instance,
                    license=license_obj,
                    licenseKey=first_lic_key,
                    maxUsers=int(concurrent_users) if concurrent_users else 40,
                    status=LmsServer.Status.ACTIVE
                )

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

        # Check if licenseKey matches a specific LMS server's pre-generated key
        server_obj = LmsServer.objects.select_related('license', 'school').filter(licenseKey=license_key).first()
        if server_obj:
            license_obj = server_obj.license
        else:
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

        if server_obj:
            server_obj.serverName = server_name
            if installation_identity and server_obj.installationId != installation_identity:
                conflict = LmsServer.objects.filter(installationId=installation_identity).exclude(pk=server_obj.pk).exists()
                if not conflict:
                    server_obj.installationId = installation_identity
            server_obj.lastSyncTime = timezone.now()
            server_obj.status = LmsServer.Status.ACTIVE
            server_obj.save()
        else:
            active_servers = LmsServer.objects.filter(license=license_obj, status=LmsServer.Status.ACTIVE)
            existing_server = active_servers.filter(installationId=installation_identity).first()
            if not existing_server:
                if active_servers.count() >= license_obj.maxLmsServers:
                    return Response({"error": "Maximum registered LMS servers capacity reached for this license."}, status=status.HTTP_400_BAD_REQUEST)
                
                auto_key = "LMS-KEY-" + uuid.uuid4().hex[:16].upper()
                server_obj = LmsServer.objects.create(
                    installationId=installation_identity,
                    serverName=server_name,
                    licenseKey=auto_key,
                    school=license_obj.school,
                    license=license_obj,
                    status=LmsServer.Status.ACTIVE,
                    lastSyncTime=timezone.now(),
                    maxUsers=40
                )
            else:
                existing_server.serverName = server_name
                existing_server.lastSyncTime = timezone.now()
                if not existing_server.licenseKey:
                    existing_server.licenseKey = "LMS-KEY-" + uuid.uuid4().hex[:16].upper()
                existing_server.save()
                server_obj = existing_server

        return Response({
            "status": "success",
            "message": "Server activated successfully.",
            "installationId": server_obj.installationId,
            "licenseKey": server_obj.licenseKey or license_obj.licenseKey,
            "maxLmsServers": license_obj.maxLmsServers,
            "concurrentUsersPerServer": server_obj.maxUsers or license_obj.concurrentUsersPerServer or 40,
            "expiryDate": str(license_obj.expiryDate)
        }, status=status.HTTP_200_OK)


class LmsServerCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, school_id=None):
        target_school_id = school_id or request.data.get("school_id") or request.data.get("schoolId")
        if not target_school_id:
            return Response({"error": "school_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            school = School.objects.select_related('school_license').get(school_id=target_school_id)
        except (School.DoesNotExist, ValueError):
            try:
                school = School.objects.select_related('school_license').get(schoolId=str(target_school_id))
            except School.DoesNotExist:
                return Response({"error": "School not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            license_obj = school.school_license
        except Exception:
            license_obj = getattr(school, 'licenseId', None)

        if not license_obj:
            return Response({"error": "School has no active license configured."}, status=status.HTTP_400_BAD_REQUEST)

        if license_obj.status != License.Status.ACTIVE:
            return Response({"error": f"Cannot create server. School license status is {license_obj.status}."}, status=status.HTTP_400_BAD_REQUEST)

        if license_obj.expiryDate and license_obj.expiryDate < timezone.now().date():
            license_obj.status = License.Status.EXPIRED
            license_obj.save()
            return Response({"error": "Cannot create server. School license has expired."}, status=status.HTTP_400_BAD_REQUEST)

        active_servers = LmsServer.objects.filter(license=license_obj, status=LmsServer.Status.ACTIVE)
        if active_servers.count() >= license_obj.maxLmsServers:
            return Response({
                "error": f"Maximum allowed LMS servers limit ({license_obj.maxLmsServers}) has already been reached for this school license."
            }, status=status.HTTP_400_BAD_REQUEST)

        server_name = request.data.get("serverName") or request.data.get("server_name")
        if not server_name:
            total_servers = LmsServer.objects.filter(school=school).count()
            server_name = f"{school.school_name} - LMS Server {total_servers + 1}"

        max_users = int(request.data.get("maxUsers", request.data.get("concurrentUsersPerServer", 40)))
        inst_id_str = "INST-" + uuid.uuid4().hex[:8].upper()
        lic_key_str = "LMS-KEY-" + uuid.uuid4().hex[:16].upper()

        server = LmsServer.objects.create(
            installationId=inst_id_str,
            serverName=server_name,
            licenseKey=lic_key_str,
            school=school,
            license=license_obj,
            status=LmsServer.Status.ACTIVE,
            maxUsers=max_users,
            lastSyncTime=None
        )

        serializer = LmsServerSerializer(server)
        return Response({
            "status": "success",
            "message": "LMS Server installation license generated successfully.",
            "server": serializer.data
        }, status=status.HTTP_201_CREATED)


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

        action_type = request.data.get("action", "deactivate")
        if action_type == "activate":
            server.status = LmsServer.Status.ACTIVE
            msg = f"Server '{server.serverName}' has been activated successfully."
        else:
            server.status = LmsServer.Status.DEACTIVATED
            msg = f"Server '{server.serverName}' has been deactivated successfully."
        server.save()

        return Response({
            "status": "success",
            "message": msg,
            "server": LmsServerSerializer(server).data
        }, status=status.HTTP_200_OK)


class LmsServerViewSet(CMSBaseViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdminOrReadOnlyStaff]
    queryset = LmsServer.objects.all().select_related("school", "license")
    serializer_class = LmsServerSerializer
    lookup_field = "installationId"
    lookup_value_regex = "[^/]+"

    @action(detail=True, methods=["post"], url_path="toggle-status")
    def toggle_status(self, request, installationId=None):
        server = self.get_object()
        new_status = LmsServer.Status.DEACTIVATED if server.status == LmsServer.Status.ACTIVE else LmsServer.Status.ACTIVE
        server.status = new_status
        server.save(update_fields=["status"])
        return Response({
            "status": "success",
            "message": f"Server '{server.serverName}' is now {'active' if new_status == LmsServer.Status.ACTIVE else 'disabled'}.",
            "server": self.get_serializer(server).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, installationId=None):
        server = self.get_object()
        server.status = LmsServer.Status.DEACTIVATED
        server.save(update_fields=["status"])
        return Response({
            "status": "success",
            "message": f"Server '{server.serverName}' has been disabled.",
            "server": self.get_serializer(server).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, installationId=None):
        server = self.get_object()
        if server.license and server.license.status != License.Status.ACTIVE:
            return Response({"error": f"Cannot activate server. School license is {server.license.status}."}, status=status.HTTP_400_BAD_REQUEST)
        server.status = LmsServer.Status.ACTIVE
        server.save(update_fields=["status"])
        return Response({
            "status": "success",
            "message": f"Server '{server.serverName}' has been enabled.",
            "server": self.get_serializer(server).data
        }, status=status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        server = self.get_object()
        server_name = request.data.get("serverName") or request.data.get("server_name")
        max_users = request.data.get("maxUsers") or request.data.get("max_users")
        status_val = request.data.get("status")

        update_fields = []
        if server_name:
            server.serverName = server_name.strip()
            update_fields.append("serverName")
        if max_users is not None:
            try:
                server.maxUsers = int(max_users)
                update_fields.append("maxUsers")
            except (ValueError, TypeError):
                pass
        if status_val and status_val in [LmsServer.Status.ACTIVE, LmsServer.Status.DEACTIVATED]:
            server.status = status_val
            update_fields.append("status")

        if update_fields:
            server.save(update_fields=update_fields)

        return Response({
            "status": "success",
            "message": f"Server '{server.serverName}' updated successfully.",
            "server": self.get_serializer(server).data
        }, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        server = self.get_object()
        server_name = server.serverName
        server.delete()
        return Response({
            "status": "success",
            "message": f"Server '{server_name}' has been deleted."
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
