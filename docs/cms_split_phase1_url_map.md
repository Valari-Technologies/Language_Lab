# CMS Split — Phase 1 URL Map Snapshot

Captured 2026-07-09, before any refactor. Used as the baseline to diff against in Phase 5.
Base path: `/api/cms/` (mounted in `backend/config/urls.py` via `path("api/cms/", include("cms.urls"))`).

| # | View | HTTP path | basename | permission_classes | Serializer(s) used |
|---|------|-----------|----------|---------------------|---------------------|
| 1 | `DashboardStatsAPIView` | `/api/cms/dashboard-stats/` | — (plain path) | `IsAuthenticated, IsSuperAdmin` | none (inline dict) |
| 2 | `GradeViewSet` | `/api/cms/grades/` | `grade` | `IsAuthenticated, IsSuperAdminOrReadOnlyStaff` | `GradeSerializer`, `GradeDetailSerializer` |
| 3 | `ScenarioViewSet` | `/api/cms/scenarios/` | `scenario` | `IsAuthenticated, IsSuperAdmin` (inherited default) | `ScenarioSerializer`, `ScenarioDetailSerializer` |
| 4 | `ScenarioBuilderViewSet` | `/api/cms/scenario-builders/` | `scenario-builder` | `IsAuthenticated, IsSuperAdmin` (inherited default) | `ScenarioBuilderSerializer` |
| 5 | `PublishContentViewSet` | `/api/cms/publish-contents/` | `publish-content` | `IsAuthenticated, IsSuperAdmin` (inherited default) | `PublishContentSerializer`, `PublishContentDetailSerializer` |
| 6 | `SchoolViewSet` | `/api/cms/schools/` | `school` | `IsAuthenticated, IsSuperAdminOrReadOnlyStaff` | `SchoolSerializer` |
| 7 | `TeacherViewSet` | `/api/cms/teachers/` | `teacher` | `IsAuthenticated, IsSuperAdminOrSchoolAdminWrite` | `TeacherSerializer` |
| 8 | `ClassViewSet` | `/api/cms/classes/` | `class` | `IsAuthenticated, IsSuperAdminOrSchoolAdminWrite` | `ClassSerializer` |
| 9 | `TeacherClassViewSet` | `/api/cms/teacher-classes/` | `teacher-class` | `IsAuthenticated, IsSuperAdminOrSchoolAdminWrite` | `TeacherClassSerializer` |
| 10 | `StudentViewSet` | `/api/cms/students/` | `student` | `IsAuthenticated, IsSuperAdminOrSchoolAdminWrite` | `StudentSerializer` |
| 11 | `SchoolAdminViewSet` | `/api/cms/school-admins/` | `school-admin` | `IsAuthenticated, IsSuperAdmin` (inherited default) | `SchoolAdminSerializer` |

All routes are registered via a single `DefaultRouter()` in `cms/urls.py`, plus one plain `path()` for the stats view. Router-generated sub-paths (list/detail/etc.) follow DRF defaults for each basename above, e.g. `/api/cms/grades/`, `/api/cms/grades/{pk}/`.

## Models currently in `cms/models.py`
`Grade, Scenario, ScenarioBuilder, PublishContent, School, SchoolAdminProfile, Teacher, Student, Class, TeacherClass`

## Shared support modules
- `cms/permissions.py`: `IsSuperAdminOrReadOnlyStaff`, `IsSuperAdminOrSchoolAdminWrite` (cms-local, distinct from `accounts/permissions.py`'s `IsSuperAdmin`, `IsInstituteAdmin`, `IsTeacher`, `IsStudent`, `IsAdminRole`, `IsTeacherOrAdmin`).
- `cms/scoping.py`: `get_user_school`, `get_user_school_id`, `filter_queryset_by_school` — imported by **`backend/accounts/views.py`** (cross-app dependency outside `cms/`).
- `cms/admin.py`: registers `Grade`, `Scenario`, `ScenarioBuilder`, `PublishContent` only (School/Teacher/Student/Class/SchoolAdminProfile/TeacherClass are NOT registered in admin).

## Frontend consumers (confirmed via grep, read-only, not modified)
- `Dashboard.jsx` (Super Admin): grades, scenarios, scenario-builders, schools, teachers, school-admins, publish-contents, dashboard-stats
- `SchoolDashboard.jsx` (School Admin): schools, grades, teachers, students, classes
- `TeacherDashboard.jsx` (Teacher): schools, grades, students, classes
