"""Teacher Reports, the class list: one row per student with progress, assessment score, time and status.

Search, sorting, filters and the pages are decided here, so a class of 30 or more students is never sent or shown
as one long list. Only the students of the class section(s) the teacher is assigned to are ever included.
"""
import math
import re
from datetime import date, timedelta

from django.conf import settings
from django.db.models import Max
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.names import title_name
from accounts.permissions import IsTeacher
from accounts.scoping import get_user_school
from assessments.models import StudentAttempt
from lms.hub.views import _section_letter
from lms.packages.views import build_level_map, resolve_grade
from lmshub.models import LmsSession
from school_admin.models import Class
from .models import Student
from .reports import _class_scope, _grade_key, _in_scope
from .rollno import _roll_key

PAGE_SIZE = 10
LESSONS_PER_ZONE = 5
ZONES = [
    {"id": 1, "name": "Summer Zone"}, {"id": 2, "name": "Winter Zone"}, {"id": 3, "name": "Spring Zone"},
    {"id": 4, "name": "Island Zone"}, {"id": 5, "name": "Desert Zone"}, {"id": 6, "name": "Lava Zone"},
]
SORTS = {"name", "score", "progress", "last_active"}
BEST_LEVELS = {"excellent", "good"}  # the students of the Best performing card
LEAST_LEVELS = {"average", "needs_improvement"}  # the students of the Least performing card
# "best" and "least" are the two card groups, as a filter
PERFORMANCES = {"excellent", "good", "average", "needs_improvement", "not_assessed", "best", "least"}
ACTIVITIES = {"active", "inactive"}
PROGRESS = {"not_started", "in_progress", "completed"}


def thresholds():
    return {
        "excellent": settings.REPORT_THRESHOLD_EXCELLENT,
        "good": settings.REPORT_THRESHOLD_GOOD,
        "average": settings.REPORT_THRESHOLD_AVERAGE,
    }


def performance_label(score):
    """Excellent, Good, Average or Needs Improvement from the average assessment score; Not assessed without one."""
    if score is None:
        return "not_assessed"
    limits = thresholds()
    if score >= limits["excellent"]:
        return "excellent"
    if score >= limits["good"]:
        return "good"
    if score >= limits["average"]:
        return "average"
    return "needs_improvement"


def _zone_of(slot):
    return (slot - 1) // LESSONS_PER_ZONE + 1


def _grade_map(grade, cache):
    """The published levels of a grade: lesson id -> level (1-30), the assessment ids, and how many levels exist."""
    if grade is None:
        return {"slots": {}, "bosses": set()}
    if grade.id not in cache:
        level_map = build_level_map(grade)
        cache[grade.id] = {
            "slots": {str(e["experienceId"]): i + 1 for i, e in enumerate(level_map["lessons"]) if e},
            "bosses": {str(e["experienceId"]) for e in level_map["bosses"] if e},
        }
    return cache[grade.id]


def _student_row(student, attempts, last_session, gmap, now):
    slots, bosses = gmap["slots"], gmap["bosses"]
    published = set(slots.values())
    done, zones_touched, assessment_scores, stamps, seconds = set(), set(), [], [], 0
    for a in attempts:
        ref = a.assignment.experience_ref
        key = str(a.level_key or "").upper()
        when = a.completed_at or a.started_at
        stamps.append(when)
        seconds += max(a.time_spent_seconds or 0, 0)
        if ref in bosses or key.startswith("B"):
            match = re.fullmatch(r"B([1-6])", key)
            if match:
                zones_touched.add(int(match.group(1)))
            if a.status == "COMPLETED" and a.percentage is not None:
                assessment_scores.append(float(a.percentage))
            continue
        slot = slots.get(ref)
        if slot is None:
            match = re.fullmatch(r"L(\d{1,2})", key)
            slot = int(match.group(1)) if match and 1 <= int(match.group(1)) <= 30 else None
        if slot:
            zones_touched.add(_zone_of(slot))
            if a.status == "COMPLETED":
                done.add(slot)
    if published:
        done &= published
    zones_done = sum(
        1 for z in range(1, len(ZONES) + 1)
        if (zone_levels := {s for s in published if _zone_of(s) == z}) and zone_levels <= done
    )
    last_active = max(stamps + ([last_session] if last_session else []), default=None)
    average = round(sum(assessment_scores) / len(assessment_scores), 1) if assessment_scores else None
    progress = round(len(done) / len(published) * 100) if published else None
    inactive_after = timedelta(days=settings.REPORT_INACTIVE_AFTER_DAYS)
    if not attempts:
        progress_status = "not_started"
    elif published and published <= done:
        progress_status = "completed"
    else:
        progress_status = "in_progress"
    return {
        "id": student.student_id,
        "name": title_name(student.user.full_name) or student.user.username,
        "loginCode": student.user.username,
        "rollNo": student.roll_no,
        "grade": student.grade,
        "section": student.section,
        "progress": progress,
        "zonesCompleted": zones_done,
        "zonesTotal": len(ZONES),
        "levelsCompleted": len(done),
        "levelsTotal": len(published),
        "avgAssessment": average,
        "attempts": len(attempts),
        "learningSeconds": seconds,
        "lastActive": last_active.isoformat() if last_active else None,
        "performance": performance_label(average),
        "activity": "active" if last_active and now - last_active <= inactive_after else "inactive",
        "progressStatus": progress_status,
        "_zones": zones_touched,
        "_days": {w.date() for w in stamps},
    }


def _date_param(request, name):
    raw = str(request.query_params.get(name) or "").strip()
    if not raw:
        return None
    return date.fromisoformat(raw)  # ValueError for a bad date, answered with 400 by the caller


def _roll_matches(roll_no, query):
    return bool(query) and _roll_key(roll_no) == _roll_key(query) or (bool(query) and query.lower() in str(roll_no or "").lower())


class TeacherClassReportAPIView(APIView):
    """GET /api/cms/v1/teacher/reports/class/ with ?page=&search=&sort=&order=&class_id=&grade_id=&zone=&performance=
    &activity=&progress=&date_from=&date_to=  Ten students a page; the overview cards follow every filter but the search."""
    permission_classes = [IsAuthenticated, IsTeacher]

    def collect(self, request):
        """(early response, None) for a bad request or a teacher without a class, else (None, the filtered and sorted rows
        with the overview and ranking). The page list and the Excel export both use it, so they always agree."""
        school = get_user_school(request.user)
        classes = list(Class.objects.filter(teacherclass__teacher__user=request.user).select_related("grade"))
        seen, class_list = set(), []
        for c in sorted(classes, key=lambda c: (c.grade.sort_order if c.grade_id else 0, c.class_name)):
            if c.class_name not in seen:
                seen.add(c.class_name)
                class_list.append({"id": c.class_id, "name": c.class_name})
        meta = {"classes": class_list, "zones": ZONES, "thresholds": thresholds(),
                "inactiveAfterDays": settings.REPORT_INACTIVE_AFTER_DAYS, "pageSize": PAGE_SIZE}
        empty = {**meta, "overview": {"totalStudents": 0, "activeStudents": 0, "inactiveStudents": 0,
                                      "avgAssessment": None, "avgProgress": None, "needsImprovement": 0, "classProgress": []},
                 "ranking": {"best": [], "least": []}, "students": [], "page": 1, "pages": 1, "total": 0}
        if not school or not classes:
            return Response(empty), None

        # which students: the teacher's own class sections, narrowed by the class or grade chosen
        by_id = {c.class_id: c for c in classes}
        chosen = classes
        if request.query_params.get("class_id"):
            raw = str(request.query_params["class_id"])
            if not raw.isdigit() or int(raw) not in by_id:
                return Response({"error": "This class is not assigned to you."}, status=status.HTTP_400_BAD_REQUEST), None
            chosen = [c for c in classes if c.class_name == by_id[int(raw)].class_name]
        elif request.query_params.get("grade_id"):
            raw = str(request.query_params["grade_id"])
            chosen = [c for c in classes if c.grade_id and str(c.grade_id) == raw]
            if not chosen:
                return Response({"error": "This grade is not assigned to you."}, status=status.HTTP_400_BAD_REQUEST), None
        scope = _class_scope(chosen)
        students = [
            s for s in Student.objects.filter(school=school, user__is_active=True).select_related("user")
            if _in_scope(s, scope)
        ]

        try:
            date_from, date_to = _date_param(request, "date_from"), _date_param(request, "date_to")
        except ValueError:
            return Response({"error": "Dates must look like 2026-11-30."}, status=status.HTTP_400_BAD_REQUEST), None
        zone = request.query_params.get("zone") or ""
        performance = request.query_params.get("performance") or ""
        activity = request.query_params.get("activity") or ""
        progress_filter = request.query_params.get("progress") or ""
        sort = request.query_params.get("sort") or "name"
        order = request.query_params.get("order") or "asc"
        if (zone and zone not in {str(z["id"]) for z in ZONES}) or (performance and performance not in PERFORMANCES) \
                or (activity and activity not in ACTIVITIES) or (progress_filter and progress_filter not in PROGRESS) \
                or sort not in SORTS or order not in {"asc", "desc"}:
            return Response({"error": "A filter or sort value is not valid."}, status=status.HTTP_400_BAD_REQUEST), None

        attempts_by_user = {}
        for attempt in StudentAttempt.objects.filter(school=school, student__in=[s.user_id for s in students]) \
                .select_related("assignment"):
            attempts_by_user.setdefault(attempt.student_id, []).append(attempt)
        last_session = {
            row["student_id"]: row["last"]
            for row in LmsSession.objects.filter(student__in=[s.student_id for s in students])
            .values("student_id").annotate(last=Max("last_heartbeat"))
        }
        grade_cache, label_cache, now = {}, {}, timezone.now()
        rows = []
        for s in students:
            if s.grade not in label_cache:
                label_cache[s.grade] = _grade_map(resolve_grade(s), grade_cache)
            rows.append(_student_row(s, attempts_by_user.get(s.user_id, []), last_session.get(s.student_id),
                                     label_cache[s.grade], now))

        def keep(row):
            if zone and int(zone) not in row["_zones"]:
                return False
            if performance == "best":
                if row["performance"] not in BEST_LEVELS:
                    return False
            elif performance == "least":
                if row["performance"] not in LEAST_LEVELS:
                    return False
            elif performance and row["performance"] != performance:
                return False
            if activity and row["activity"] != activity:
                return False
            if progress_filter and row["progressStatus"] != progress_filter:
                return False
            if date_from or date_to:
                if not any((not date_from or d >= date_from) and (not date_to or d <= date_to) for d in row["_days"]):
                    return False
            return True

        scoped = [r for r in rows if keep(r)]
        scored = [r["avgAssessment"] for r in scoped if r["avgAssessment"] is not None]
        progressed = [r["progress"] for r in scoped if r["progress"] is not None]
        overview = {
            "totalStudents": len(scoped),
            "activeStudents": sum(1 for r in scoped if r["activity"] == "active"),
            "inactiveStudents": sum(1 for r in scoped if r["activity"] == "inactive"),
            "avgAssessment": round(sum(scored) / len(scored), 1) if scored else None,
            "avgProgress": round(sum(progressed) / len(progressed), 1) if progressed else None,
            "needsImprovement": sum(1 for r in scoped if r["performance"] == "needs_improvement"),
        }

        # progress of each class of the teacher (the card names the class with the highest one; clicking it lists them all):
        # the same average as the card, taken over the students of that class only
        class_keys, names_seen = [], set()
        for c in sorted(chosen, key=lambda c: (c.grade.sort_order if c.grade_id else 0, c.class_name)):
            if c.grade_id and c.class_name not in names_seen:
                names_seen.add(c.class_name)
                class_keys.append((c.class_id, c.class_name, _grade_key(c.grade.grade_name), _section_letter(c.class_name)))
        members_of = {key[0]: [] for key in class_keys}
        for r in scoped:
            g, s = _grade_key(r["grade"]), _section_letter(r["section"])
            match = next((k for k in class_keys if k[2] == g and k[3] == s), None) \
                or next((k for k in class_keys if k[2] == g and k[3] == ""), None)  # a class without a section letter
            if match:
                members_of[match[0]].append(r)
        class_progress = []
        for class_id, name, _grade, _section in class_keys:
            values = [r["progress"] for r in members_of[class_id] if r["progress"] is not None]
            class_progress.append({"classId": class_id, "name": name, "students": len(members_of[class_id]),
                                   "avgProgress": round(sum(values) / len(values), 1) if values else None})
        class_progress.sort(key=lambda c: (c["avgProgress"] is None, -(c["avgProgress"] or 0), c["name"]))
        overview["classProgress"] = class_progress

        # the cards: Best = the Excellent and Good students, Least = the Average and Needs Improvement students; each card
        # shows the three highest (Best) or the three lowest (Least) scores of its group, and clicking it lists the group
        top = sorted((r for r in scoped if r["performance"] in BEST_LEVELS),
                     key=lambda r: (-r["avgAssessment"], -r["levelsCompleted"], r["name"].lower()))
        low = sorted((r for r in scoped if r["performance"] in LEAST_LEVELS),
                     key=lambda r: (r["avgAssessment"], r["levelsCompleted"], r["name"].lower()))
        ranking = {"best": top[:3], "least": low[:3]}

        query = (request.query_params.get("search") or "").strip()
        matched = scoped
        if query:
            lowered = query.lower()
            matched = [r for r in scoped if lowered in r["name"].lower() or lowered in str(r["loginCode"]).lower()
                       or _roll_matches(r["rollNo"], query)]

        def sort_key(r):
            if sort == "name":
                return (0, r["name"].lower())
            value = {"score": r["avgAssessment"], "progress": r["progress"], "last_active": r["lastActive"]}[sort]
            return (1, "") if value is None else (0, value)

        present = [r for r in matched if sort == "name" or sort_key(r)[0] == 0]
        missing = [r for r in matched if not (sort == "name" or sort_key(r)[0] == 0)]  # no value: always at the end
        present.sort(key=lambda r: (sort_key(r)[1], r["name"].lower()), reverse=(order == "desc"))
        ordered = present + sorted(missing, key=lambda r: r["name"].lower())
        return None, {"meta": meta, "overview": overview, "ranking": ranking, "ordered": ordered}

    def get(self, request):
        early, found = self.collect(request)
        if early is not None:
            return early
        ordered = found["ordered"]
        pages = max(1, math.ceil(len(ordered) / PAGE_SIZE))
        try:
            page = min(max(int(request.query_params.get("page") or 1), 1), pages)
        except ValueError:
            page = 1
        window = ordered[(page - 1) * PAGE_SIZE: page * PAGE_SIZE]
        if request.query_params.get("all") == "1":  # the downloaded report: every student that matches, on one page
            window, page, pages = ordered, 1, 1

        def clean(r):
            return {k: v for k, v in r.items() if not k.startswith("_")}

        return Response({
            **found["meta"], "overview": found["overview"], "page": page, "pages": pages, "total": len(ordered),
            "students": [clean(r) for r in window],
            "ranking": {k: [{"id": r["id"], "name": r["name"], "grade": r["grade"], "section": r["section"],
                             "avgAssessment": r["avgAssessment"], "levelsCompleted": r["levelsCompleted"]} for r in v]
                        for k, v in found["ranking"].items()},
        })


PERFORMANCE_LABELS = {"excellent": "Excellent", "good": "Good", "average": "Average",
                      "needs_improvement": "Needs Improvement", "not_assessed": "Not assessed"}


def _hms(seconds):
    s = max(int(seconds or 0), 0)
    return f"{s // 3600:02d}:{s % 3600 // 60:02d}:{s % 60:02d}"


class TeacherClassExportAPIView(TeacherClassReportAPIView):
    """GET /api/cms/v1/teacher/reports/class/export/ with the same filters as the list: an Excel file with a row for every
    student that matches them (all pages, not only the ten on screen)."""

    def get(self, request):
        import openpyxl
        from django.http import HttpResponse
        from openpyxl.styles import Font, PatternFill
        from openpyxl.utils import get_column_letter

        early, found = self.collect(request)
        if early is not None and early.status_code != 200:
            return early
        rows = found["ordered"] if found else []
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Class report"
        head = ["Student", "Student ID", "Roll No", "Class", "Section", "Overall progress %", "Zones completed",
                "Levels completed", "Levels published", "Avg assessment score %", "Attempts", "Learning time (hh:mm:ss)",
                "Last active", "Performance", "Activity"]
        ws.append(head)
        for cell in ws[1]:
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = PatternFill("solid", fgColor="2563EB")
        for r in rows:
            ws.append([
                r["name"], r["loginCode"], r["rollNo"] or "", r["grade"] or "", r["section"] or "",
                r["progress"] if r["progress"] is not None else "", f'{r["zonesCompleted"]}/{r["zonesTotal"]}',
                r["levelsCompleted"], r["levelsTotal"], r["avgAssessment"] if r["avgAssessment"] is not None else "Not assessed",
                r["attempts"], _hms(r["learningSeconds"]),
                r["lastActive"][:16].replace("T", " ") if r["lastActive"] else "",
                PERFORMANCE_LABELS[r["performance"]], "Active" if r["activity"] == "active" else "Inactive",
            ])
        for i, column in enumerate(head, start=1):
            ws.column_dimensions[get_column_letter(i)].width = max(14, len(column) + 2)
        ws.column_dimensions["A"].width = 26
        ws.freeze_panes = "A2"
        response = HttpResponse(content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        chosen = next((c["name"] for c in (found["meta"]["classes"] if found else [])
                       if str(c["id"]) == str(request.query_params.get("class_id"))), "")
        label = f"_{re.sub(r'[^A-Za-z0-9-]+', '-', chosen).strip('-')}" if chosen else ""  # the class in the file name
        response["Content-Disposition"] = f'attachment; filename="class_report{label}_{timezone.now().date().isoformat()}.xlsx"'
        wb.save(response)
        return response
