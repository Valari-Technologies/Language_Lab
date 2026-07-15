import csv
from django.http import HttpResponse
from django.db import models
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsAdminRole
from accounts.scoping import filter_queryset_by_school, get_user_school
from super_admin.models import School, Grade
from school_admin.models import Class, Teacher, TeacherClass
from teacher.models import Student
from django.contrib.auth import get_user_model

from .models import ScenarioAssignment, StudentAttempt, ScreenResponse
from .serializers import (
    ScenarioAssignmentSyncSerializer,
    StudentAttemptSyncSerializer,
    ScreenResponseSyncSerializer,
    OverviewReportSerializer,
    ScenarioReportSerializer,
    ClassReportSerializer,
    StudentReportSerializer,
    TeacherReportSerializer
)

User = get_user_model()


class SyncAssignmentsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = ScenarioAssignmentSyncSerializer

    def post(self, request):
        # Note: Production should use API keys or service tokens instead of user JWT.
        payload = request.data
        if isinstance(payload, dict) and "assignments" in payload:
            payload = payload["assignments"]
        elif not isinstance(payload, list):
            payload = [payload]
        
        user_school = get_user_school(request.user)
        created_count = 0
        updated_count = 0
        failed_count = 0
        errors = []

        for index, item in enumerate(payload):
            serializer = ScenarioAssignmentSyncSerializer(data=item)
            if not serializer.is_valid():
                failed_count += 1
                errors.append({"row": index, "errors": serializer.errors})
                continue
            
            data = serializer.validated_data
            
            # Resolve school
            target_school = user_school
            if target_school is None:
                target_school = data.get("school")
            
            if target_school is None:
                failed_count += 1
                errors.append({"row": index, "errors": "School is required."})
                continue

            # Class validation
            class_obj = data.get("class_obj")
            if class_obj and class_obj.school != target_school:
                failed_count += 1
                errors.append({"row": index, "errors": f"Class does not belong to school {target_school.school_id}"})
                continue

            # Resolve assigned_by user
            assigned_by_user = None
            assigned_by_username = data.get("assigned_by_username")
            if assigned_by_username:
                assigned_by_user = User.objects.filter(username=assigned_by_username).first()

            try:
                assignment, created = ScenarioAssignment.objects.update_or_create(
                    school=target_school,
                    scenario_ref=data["scenario_ref"],
                    class_obj=class_obj,
                    defaults={
                        "scenario_title": data["scenario_title"],
                        "grade": data.get("grade"),
                        "assigned_by": assigned_by_user,
                        "assigned_at": data["assigned_at"]
                    }
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1
            except Exception as e:
                failed_count += 1
                errors.append({"row": index, "errors": str(e)})

        return Response({
            "created": created_count,
            "updated": updated_count,
            "failed": failed_count,
            "errors": errors
        }, status=status.HTTP_200_OK)


class SyncAttemptsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = StudentAttemptSyncSerializer

    def post(self, request):
        # Note: Production should use API keys or service tokens instead of user JWT.
        payload = request.data
        if isinstance(payload, dict) and "attempts" in payload:
            payload = payload["attempts"]
        elif not isinstance(payload, list):
            payload = [payload]
        
        user_school = get_user_school(request.user)
        created_count = 0
        updated_count = 0
        failed_count = 0
        errors = []

        for index, item in enumerate(payload):
            serializer = StudentAttemptSyncSerializer(data=item)
            if not serializer.is_valid():
                failed_count += 1
                errors.append({"row": index, "errors": serializer.errors})
                continue
            
            data = serializer.validated_data
            
            # Resolve school
            target_school = user_school
            if target_school is None:
                target_school = data.get("school")
            
            if target_school is None:
                failed_count += 1
                errors.append({"row": index, "errors": "School is required."})
                continue

            # Resolve student user and check school scoping
            student_username = data.get("student_username")
            student_id = data.get("student")
            student_user = None
            if student_id:
                student_user = User.objects.filter(id=student_id, role="STUDENT").first()
            elif student_username:
                student_user = User.objects.filter(username=student_username, role="STUDENT").first()

            if not student_user:
                failed_count += 1
                errors.append({"row": index, "errors": f"Student '{student_id or student_username}' does not exist."})
                continue

            student_name = student_user.username
            if not Student.objects.filter(user=student_user, school=target_school).exists():
                failed_count += 1
                errors.append({"row": index, "errors": f"Student '{student_name}' does not belong to school {target_school.school_id}"})
                continue

            # Find or create ScenarioAssignment
            scenario_ref = data.get("scenario_ref")
            assignment_id = data.get("assignment")
            assignment = None
            if assignment_id:
                assignment = ScenarioAssignment.objects.filter(id=assignment_id, school=target_school).first()
            elif scenario_ref:
                assignment = ScenarioAssignment.objects.filter(school=target_school, scenario_ref=scenario_ref).first()

            if not assignment:
                if scenario_ref:
                    started_at_val = data.get("started_at") or timezone.now()
                    assignment = ScenarioAssignment.objects.create(
                        school=target_school,
                        scenario_ref=scenario_ref,
                        scenario_title=scenario_ref,
                        assigned_at=started_at_val
                    )
                else:
                    failed_count += 1
                    errors.append({"row": index, "errors": "Assignment or scenario_ref is required."})
                    continue

            started_at_val = data.get("started_at") or timezone.now()

            try:
                attempt, created = StudentAttempt.objects.update_or_create(
                    lms_attempt_id=data["lms_attempt_id"],
                    defaults={
                        "assignment": assignment,
                        "student": student_user,
                        "school": target_school,
                        "started_at": started_at_val,
                        "completed_at": data.get("completed_at"),
                        "status": data.get("status", "STARTED"),
                        "total_score": data.get("total_score"),
                        "max_score": data.get("max_score"),
                        "percentage": data.get("percentage"),
                        "time_spent_seconds": data.get("time_spent_seconds")
                    }
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1
            except Exception as e:
                failed_count += 1
                errors.append({"row": index, "errors": str(e)})

        return Response({
            "created": created_count,
            "updated": updated_count,
            "failed": failed_count,
            "errors": errors
        }, status=status.HTTP_200_OK)


class SyncResponsesAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = ScreenResponseSyncSerializer

    def post(self, request):
        # Note: Production should use API keys or service tokens instead of user JWT.
        payload = request.data
        if isinstance(payload, dict) and "responses" in payload:
            payload = payload["responses"]
        elif not isinstance(payload, list):
            payload = [payload]
        
        created_count = 0
        updated_count = 0
        failed_count = 0
        errors = []

        for index, item in enumerate(payload):
            serializer = ScreenResponseSyncSerializer(data=item)
            if not serializer.is_valid():
                failed_count += 1
                errors.append({"row": index, "errors": serializer.errors})
                continue
            
            data = serializer.validated_data
            
            # Resolve attempt
            lms_attempt_id = data.get("lms_attempt_id")
            attempt = StudentAttempt.objects.filter(lms_attempt_id=lms_attempt_id).first()
            if not attempt:
                failed_count += 1
                errors.append({"row": index, "errors": f"Attempt '{lms_attempt_id}' does not exist."})
                continue

            try:
                response_obj, created = ScreenResponse.objects.update_or_create(
                    attempt=attempt,
                    screen_ref=data["screen_ref"],
                    defaults={
                        "school": attempt.school,
                        "screen_title": data["screen_title"],
                        "screen_type": data["screen_type"],
                        "response_data": data.get("response_data", {}),
                        "score": data.get("score"),
                        "max_score": data.get("max_score"),
                        "is_correct": data.get("is_correct"),
                        "time_spent_seconds": data.get("time_spent_seconds")
                    }
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1
            except Exception as e:
                failed_count += 1
                errors.append({"row": index, "errors": str(e)})

        return Response({
            "created": created_count,
            "updated": updated_count,
            "failed": failed_count,
            "errors": errors
        }, status=status.HTTP_200_OK)


class ReportsOverviewAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = OverviewReportSerializer

    def get(self, request):
        attempts = filter_queryset_by_school(StudentAttempt.objects.all(), request.user)
        
        total_students = attempts.values("student").distinct().count()
        total_attempts = attempts.count()
        total_completed = attempts.filter(status="COMPLETED").count()
        
        completion_rate = (total_completed / total_attempts * 100) if total_attempts > 0 else 0.0
        
        completed_attempts = attempts.filter(status="COMPLETED", percentage__isnull=False)
        average_score = completed_attempts.aggregate(avg=models.Avg("percentage"))["avg"] or 0.0
        
        passed_attempts = completed_attempts.filter(percentage__gte=60.0).count()
        pass_rate = (passed_attempts / total_completed * 100) if total_completed > 0 else 0.0
        
        total_scenarios_attempted = attempts.values("assignment__scenario_ref").distinct().count()
        recent_syncs = list(attempts.order_by("-synced_at").values_list("synced_at", flat=True)[:5])

        return Response({
            "total_students": total_students,
            "total_attempts": total_attempts,
            "total_completed": total_completed,
            "completion_rate": round(float(completion_rate), 2),
            "average_score": round(float(average_score), 2),
            "pass_rate": round(float(pass_rate), 2),
            "total_scenarios_attempted": total_scenarios_attempted,
            "recent_syncs": recent_syncs
        }, status=status.HTTP_200_OK)


class ReportsScenariosAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = ScenarioReportSerializer

    def get(self, request):
        attempts = filter_queryset_by_school(StudentAttempt.objects.all(), request.user)
        
        scenario_refs = attempts.values_list("assignment__scenario_ref", flat=True).distinct()
        
        results = []
        for ref in scenario_refs:
            scenario_attempts = attempts.filter(assignment__scenario_ref=ref)
            first_att = scenario_attempts.first()
            scenario_title = first_att.assignment.scenario_title if first_att else ref
            
            total_attempts = scenario_attempts.count()
            completed = scenario_attempts.filter(status="COMPLETED").count()
            
            completed_attempts = scenario_attempts.filter(status="COMPLETED", percentage__isnull=False)
            average_score = completed_attempts.aggregate(avg=models.Avg("percentage"))["avg"] or 0.0
            
            passed = completed_attempts.filter(percentage__gte=60.0).count()
            pass_rate = (passed / completed * 100) if completed > 0 else 0.0
            
            highest_score = completed_attempts.aggregate(max_score=models.Max("percentage"))["max_score"] or 0.0
            lowest_score = completed_attempts.aggregate(min_score=models.Min("percentage"))["min_score"] or 0.0
            
            avg_time = completed_attempts.aggregate(avg_time=models.Avg("time_spent_seconds"))["avg_time"] or 0.0
            
            results.append({
                "scenario_ref": ref,
                "scenario_title": scenario_title,
                "total_attempts": total_attempts,
                "completed": completed,
                "average_score": round(float(average_score), 2),
                "pass_rate": round(float(pass_rate), 2),
                "highest_score": round(float(highest_score), 2),
                "lowest_score": round(float(lowest_score), 2),
                "average_time_seconds": round(float(avg_time), 2)
            })
        
        return Response(results, status=status.HTTP_200_OK)


class ReportsScenarioDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = ScenarioReportSerializer

    def get(self, request, scenario_ref):
        attempts = filter_queryset_by_school(StudentAttempt.objects.all(), request.user).filter(assignment__scenario_ref=scenario_ref)
        if not attempts.exists():
            return Response({"message": "Scenario report not found or no attempts."}, status=status.HTTP_404_NOT_FOUND)
        
        scenario_title = attempts.first().assignment.scenario_title
        total_attempts = attempts.count()
        completed = attempts.filter(status="COMPLETED").count()
        
        completed_attempts = attempts.filter(status="COMPLETED", percentage__isnull=False)
        average_score = completed_attempts.aggregate(avg=models.Avg("percentage"))["avg"] or 0.0
        
        passed = completed_attempts.filter(percentage__gte=60.0).count()
        pass_rate = (passed / completed * 100) if completed > 0 else 0.0
        
        highest_score = completed_attempts.aggregate(max_score=models.Max("percentage"))["max_score"] or 0.0
        lowest_score = completed_attempts.aggregate(min_score=models.Min("percentage"))["min_score"] or 0.0
        
        avg_time = completed_attempts.aggregate(avg_time=models.Avg("time_spent_seconds"))["avg_time"] or 0.0
        
        attempts_list = []
        for att in attempts.select_related("student", "assignment__class_obj"):
            class_name = att.assignment.class_obj.class_name if att.assignment.class_obj else "N/A"
            attempts_list.append({
                "student_name": att.student.full_name or att.student.username,
                "class_name": class_name,
                "score": float(att.total_score) if att.total_score else None,
                "max_score": float(att.max_score) if att.max_score else None,
                "percentage": float(att.percentage) if att.percentage else None,
                "status": att.status,
                "started_at": att.started_at,
                "completed_at": att.completed_at,
                "time_spent_seconds": att.time_spent_seconds
            })

        return Response({
            "scenario_ref": scenario_ref,
            "scenario_title": scenario_title,
            "total_attempts": total_attempts,
            "completed": completed,
            "average_score": round(float(average_score), 2),
            "pass_rate": round(float(pass_rate), 2),
            "highest_score": round(float(highest_score), 2),
            "lowest_score": round(float(lowest_score), 2),
            "average_time_seconds": round(float(avg_time), 2),
            "attempts": attempts_list
        }, status=status.HTTP_200_OK)


class ReportsClassesAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = ClassReportSerializer

    def get(self, request):
        school = get_user_school(request.user)
        if school:
            classes = Class.objects.filter(school=school)
        else:
            classes = Class.objects.all()
        
        attempts = filter_queryset_by_school(StudentAttempt.objects.all(), request.user)
        
        results = []
        for c in classes:
            class_attempts = attempts.filter(assignment__class_obj=c)
            
            total_students = class_attempts.values("student").distinct().count()
            completed = class_attempts.filter(status="COMPLETED").count()
            
            completed_attempts = class_attempts.filter(status="COMPLETED", percentage__isnull=False)
            average_score = completed_attempts.aggregate(avg=models.Avg("percentage"))["avg"] or 0.0
            
            passed = completed_attempts.filter(percentage__gte=60.0).count()
            pass_rate = (passed / completed * 100) if completed > 0 else 0.0
            
            student_averages = class_attempts.filter(percentage__isnull=False).values("student__full_name", "student__username").annotate(avg_pct=models.Avg("percentage")).order_by("-avg_pct")
            
            top_student = "N/A"
            weakest_student = "N/A"
            if student_averages.exists():
                top = student_averages.first()
                top_student = top["student__full_name"] or top["student__username"]
                weak = student_averages.last()
                weakest_student = weak["student__full_name"] or weak["student__username"]
                
            results.append({
                "class_id": c.class_id,
                "class_name": c.class_name,
                "total_students": total_students,
                "attempted": total_students,
                "completed": completed,
                "average_score": round(float(average_score), 2),
                "pass_rate": round(float(pass_rate), 2),
                "top_student": top_student,
                "weakest_student": weakest_student
            })
            
        return Response(results, status=status.HTTP_200_OK)


class ReportsClassDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = ClassReportSerializer

    def get(self, request, class_id):
        school = get_user_school(request.user)
        if school:
            c = Class.objects.filter(school=school, class_id=class_id).first()
        else:
            c = Class.objects.filter(class_id=class_id).first()
            
        if not c:
            return Response({"message": "Class not found or access denied."}, status=status.HTTP_404_NOT_FOUND)
        
        attempts = filter_queryset_by_school(StudentAttempt.objects.all(), request.user).filter(assignment__class_obj=c)
        total_students = attempts.values("student").distinct().count()
        completed = attempts.filter(status="COMPLETED").count()
        
        completed_attempts = attempts.filter(status="COMPLETED", percentage__isnull=False)
        average_score = completed_attempts.aggregate(avg=models.Avg("percentage"))["avg"] or 0.0
        
        passed = completed_attempts.filter(percentage__gte=60.0).count()
        pass_rate = (passed / completed * 100) if completed > 0 else 0.0
        
        students_list = []
        student_ids = attempts.values_list("student", flat=True).distinct()
        for sid in student_ids:
            student_user = User.objects.get(id=sid)
            student_attempts = attempts.filter(student=student_user)
            std_completed = student_attempts.filter(status="COMPLETED").count()
            std_completed_attempts = student_attempts.filter(status="COMPLETED", percentage__isnull=False)
            std_avg = std_completed_attempts.aggregate(avg=models.Avg("percentage"))["avg"] or 0.0
            last_attempt = student_attempts.order_by("-started_at").first()
            
            students_list.append({
                "student_id": student_user.id,
                "student_name": student_user.full_name or student_user.username,
                "total_attempts": student_attempts.count(),
                "completed": std_completed,
                "average_score": round(float(std_avg), 2),
                "last_attempt_date": last_attempt.started_at if last_attempt else None
            })

        return Response({
            "class_id": c.class_id,
            "class_name": c.class_name,
            "total_students": total_students,
            "attempted": total_students,
            "completed": completed,
            "average_score": round(float(average_score), 2),
            "pass_rate": round(float(pass_rate), 2),
            "students": students_list
        }, status=status.HTTP_200_OK)


class ReportsStudentsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = StudentReportSerializer

    def get(self, request):
        attempts = filter_queryset_by_school(StudentAttempt.objects.all(), request.user)
        
        student_ids = attempts.values_list("student", flat=True).distinct()
        
        results = []
        for sid in student_ids:
            student_user = User.objects.get(id=sid)
            student_attempts = attempts.filter(student=student_user)
            
            total_attempts = student_attempts.count()
            completed = student_attempts.filter(status="COMPLETED").count()
            
            completed_attempts = student_attempts.filter(status="COMPLETED", percentage__isnull=False)
            average_score = completed_attempts.aggregate(avg=models.Avg("percentage"))["avg"] or 0.0
            
            best_scenario = "N/A"
            worst_scenario = "N/A"
            
            scenario_scores = student_attempts.filter(percentage__isnull=False).values("assignment__scenario_title").annotate(avg_pct=models.Avg("percentage")).order_by("-avg_pct")
            if scenario_scores.exists():
                best_scenario = scenario_scores.first()["assignment__scenario_title"]
                worst_scenario = scenario_scores.last()["assignment__scenario_title"]
                
            last_attempt = student_attempts.order_by("-started_at").first()
            
            classes = list(student_attempts.values_list("assignment__class_obj__class_name", flat=True).distinct())
            class_name = ", ".join(filter(None, classes)) or "N/A"
            
            results.append({
                "student_id": student_user.id,
                "student_name": student_user.full_name or student_user.username,
                "class_name": class_name,
                "total_attempts": total_attempts,
                "completed": completed,
                "average_score": round(float(average_score), 2),
                "best_scenario": best_scenario,
                "worst_scenario": worst_scenario,
                "last_attempt_date": last_attempt.started_at if last_attempt else None
            })
            
        return Response(results, status=status.HTTP_200_OK)


class ReportsStudentDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = StudentReportSerializer

    def get(self, request, student_id):
        student_user = User.objects.filter(id=student_id, role="STUDENT").first()
        if not student_user:
            return Response({"message": "Student not found."}, status=status.HTTP_404_NOT_FOUND)
        
        school = get_user_school(request.user)
        if school and not Student.objects.filter(user=student_user, school=school).exists():
            return Response({"message": "Access denied to student reports."}, status=status.HTTP_403_FORBIDDEN)
            
        attempts = StudentAttempt.objects.filter(student=student_user)
        if school:
            attempts = attempts.filter(school=school)
            
        total_attempts = attempts.count()
        completed = attempts.filter(status="COMPLETED").count()
        completed_attempts = attempts.filter(status="COMPLETED", percentage__isnull=False)
        average_score = completed_attempts.aggregate(avg=models.Avg("percentage"))["avg"] or 0.0
        
        attempts_list = []
        for att in attempts.select_related("assignment__class_obj"):
            attempts_list.append({
                "lms_attempt_id": att.lms_attempt_id,
                "scenario_ref": att.assignment.scenario_ref,
                "scenario_title": att.assignment.scenario_title,
                "class_name": att.assignment.class_obj.class_name if att.assignment.class_obj else "N/A",
                "started_at": att.started_at,
                "completed_at": att.completed_at,
                "status": att.status,
                "score": float(att.total_score) if att.total_score else None,
                "max_score": float(att.max_score) if att.max_score else None,
                "percentage": float(att.percentage) if att.percentage else None,
                "time_spent_seconds": att.time_spent_seconds
            })

        return Response({
            "student_id": student_user.id,
            "student_name": student_user.full_name or student_user.username,
            "total_attempts": total_attempts,
            "completed": completed,
            "average_score": round(float(average_score), 2),
            "attempts": attempts_list
        }, status=status.HTTP_200_OK)


class ReportsTeachersAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = TeacherReportSerializer

    def get(self, request):
        school = get_user_school(request.user)
        if school:
            teachers = Teacher.objects.filter(school=school).select_related("user")
        else:
            teachers = Teacher.objects.all().select_related("user")
            
        attempts = filter_queryset_by_school(StudentAttempt.objects.all(), request.user)
        
        results = []
        for t in teachers:
            class_ids = TeacherClass.objects.filter(teacher=t).values_list("class_obj", flat=True)
            teacher_classes = Class.objects.filter(class_id__in=class_ids)
            
            teacher_attempts = attempts.filter(assignment__class_obj__in=teacher_classes)
            
            total_students = teacher_attempts.values("student").distinct().count()
            completed = teacher_attempts.filter(status="COMPLETED").count()
            completed_attempts = teacher_attempts.filter(status="COMPLETED", percentage__isnull=False)
            average_score = completed_attempts.aggregate(avg=models.Avg("percentage"))["avg"] or 0.0
            
            best_class = "N/A"
            weakest_class = "N/A"
            class_averages = teacher_attempts.filter(percentage__isnull=False).values("assignment__class_obj__class_name").annotate(avg_pct=models.Avg("percentage")).order_by("-avg_pct")
            if class_averages.exists():
                best_class = class_averages.first()["assignment__class_obj__class_name"]
                weakest_class = class_averages.last()["assignment__class_obj__class_name"]
                
            results.append({
                "teacher_id": t.teacher_id,
                "teacher_name": t.user.full_name or t.user.username,
                "classes_count": teacher_classes.count(),
                "total_students": total_students,
                "average_class_score": round(float(average_score), 2),
                "best_class": best_class,
                "weakest_class": weakest_class
            })
            
        return Response(results, status=status.HTTP_200_OK)


class ReportsExportAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        export_type = request.query_params.get("type", "scenarios")
        
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="report_{export_type}_{timezone.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        
        if export_type == "scenarios":
            writer.writerow([
                "Scenario Ref", "Scenario Title", "Total Attempts", 
                "Completed Attempts", "Average Score (%)", "Pass Rate (%)", 
                "Highest Score (%)", "Lowest Score (%)", "Average Time (Seconds)"
            ])
            scenarios_view = ReportsScenariosAPIView()
            data = scenarios_view.get(request).data
            for row in data:
                writer.writerow([
                    row["scenario_ref"], row["scenario_title"], row["total_attempts"],
                    row["completed"], row["average_score"], row["pass_rate"],
                    row["highest_score"], row["lowest_score"], row["average_time_seconds"]
                ])
                
        elif export_type == "classes":
            writer.writerow([
                "Class ID", "Class Name", "Total Students", "Attempted",
                "Completed Attempts", "Average Score (%)", "Pass Rate (%)",
                "Top Student", "Weakest Student"
            ])
            classes_view = ReportsClassesAPIView()
            data = classes_view.get(request).data
            for row in data:
                writer.writerow([
                    row["class_id"], row["class_name"], row["total_students"], row["attempted"],
                    row["completed"], row["average_score"], row["pass_rate"],
                    row["top_student"], row["weakest_student"]
                ])
                
        elif export_type == "students":
            writer.writerow([
                "Student ID", "Student Name", "Class Name", "Total Attempts",
                "Completed Attempts", "Average Score (%)", "Best Scenario",
                "Worst Scenario", "Last Attempt Date"
            ])
            students_view = ReportsStudentsAPIView()
            data = students_view.get(request).data
            for row in data:
                writer.writerow([
                    row["student_id"], row["student_name"], row["class_name"], row["total_attempts"],
                    row["completed"], row["average_score"], row["best_scenario"],
                    row["worst_scenario"], row["last_attempt_date"]
                ])
        else:
            return Response({"message": "Invalid export type."}, status=status.HTTP_400_BAD_REQUEST)
            
        return response
