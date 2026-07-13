# AI Agent Instructions for Language Lab CMS

## 1. WHAT THIS PROJECT IS
- Role-based educational CMS.
- Backend: Django + DRF, JWT (SimpleJWT), PostgreSQL (db name from backend/.env).
- Frontend: React (Vite), Vanilla CSS, React Icons.
- Goal: stable production-ready V1 that will later integrate with an Electron LMS.
- Four roles exist: Super Admin, School Admin, Teacher, and Content Creator. The Content Creator is a global platform role (non-school-scoped). Never add a new role or user model.

## 2. REPO LAYOUT
- **Backend (`backend/`)**:
  - `config/`: Django project configuration, settings, urls.
  - `accounts/`: User authentication, role management, permissions.
  - content/: Scenarios, Scenario Builders, content models, and API endpoints (for delivery/schools).
  - content_studio/: Content Studio subsystem (experiences, activities, screens, media, validation, publishing).
- **Frontend (`frontend/src/`)**:
  - `config.js`: Contains `API_BASE_URL` for backend connections.
  - `main.jsx`: React entry point.
  - `Login.jsx`: Authentication page.
  - `Dashboard.jsx`: Super Admin dashboard for overall management.
  - `SchoolDashboard.jsx`: School Admin dashboard for managing their school's users.
  - `TeacherDashboard.jsx`: Teacher dashboard for managing scenarios and content.

## 3. HARD RULES
- Work in phases: explore and report BEFORE editing.
- One change at a time; show a summary after each.
- Ask before assuming when anything is ambiguous.
- Preserve working modules; do not redesign, re-architect, or add new business modules unless asked.
- Never overstate completion; if untested or uncertain, say so.
- Never hand-edit historical migration files.

## 4. NAMING STANDARD
- "Learning Experience" -> "Scenario"
- "Experience Steps" -> "Scenario Builder"
- Keep consistent everywhere except already-committed historical migrations.
- The obsolete school-facing `content.Scenario` has been removed. The Content Studio's `Scenario` model (`content_studio`) is now the sole scenario model in the system.

## 5. FRONTEND <-> BACKEND CONTRACT
- All API calls must use `frontend/src/config.js` (`API_BASE_URL`). Never hardcode localhost/127.0.0.1 elsewhere.
- Canonical routes: All scenario authoring and publishing endpoints reside in `content_studio` under `/api/v1/` (e.g. `/api/v1/content/scenarios/`, `/api/v1/content/media/`, `/api/v1/dashboard/`).
- The obsolete `/api/cms/scenarios/`, `/api/cms/scenario-builders/`, and `/api/cms/publish-contents/` endpoints have been removed.
- Confirm a route exists in `content_studio/urls.py` or `accounts/urls.py` before wiring a frontend call.

## 6. CURRENT STATE / KNOWN ISSUES
- **What Works:** Authentication (JWT, role-based), full CRUD for Super Admin (schools, grades, school admins), School Admin CRUD for teachers/classes/students scoped to their own school, Teacher read-only access scoped to their own school, profile updates + password change, School Admin and Teacher dashboards backed by real scoped DB queries (teacher/student/class counts, assigned classes). Cross-school data isolation verified end-to-end (School Admin/Teacher cannot list, fetch-by-id, or write another school's records). Content Studio is namespaced with read-only GET APIs under `/api/v1/`.
- **Not Built (Leave clean empty states, DO NOT fake with mock data):**
  - Reports
  - Media upload
  - Real Publish pipeline (Publish pipeline is metadata-only — no actual export/file generation)
  - Grading/submissions (no Submission or Score model exists yet — Teacher dashboard's `grading_queue_count`/`student_rankings` are honest empty/zero placeholders, not fake data)
  - Dashboard analytics without a backing model yet (engagement rate, activity feed, announcements, upcoming lessons, teacher's active-scenario count) — also honest empty/zero placeholders

## 7. VERIFICATION COMMANDS
- **Backend:** `python manage.py check`, `python manage.py makemigrations --check --dry-run`, `python manage.py test content_studio accounts super_admin school_admin teacher`
- **Frontend:** `npm run build`
- **Running both servers:**
  - Backend: `python manage.py runserver` (in `backend/`)
  - Frontend: `npm run dev` (in `frontend/`)
- **Never claim success on a check you did not actually run.**

## 8. HOW TO START A TASK
- Restate the task, list files to touch, fix + verify, then summarize honestly.
