# AI Agent Instructions for Language Lab CMS

## 1. WHAT THIS PROJECT IS
- Role-based educational CMS.
- Backend: Django + DRF, JWT (SimpleJWT), PostgreSQL (db name from backend/.env).
- Frontend: React (Vite), Vanilla CSS, React Icons.
- Goal: stable production-ready V1 that will later integrate with an Electron LMS.
- Core Roles:
  - `SUPER_ADMIN`: Global access.
  - `SCHOOL_ADMIN`: Scoped to single school tenant.
  - `TEACHER`: Scoped to single school tenant.
  - `STUDENT`: Scoped to single school tenant.
  - `CONTENT_CREATOR`: Global platform role (unscoped, Content Studio authoring only).

## 2. REPO LAYOUT
- **Backend (`backend/`)**:
  - `config/`: Django project configuration, settings, urls.
  - `accounts/`: User authentication, role management, permissions.
  - `content/`: Obsolete content app.
  - `content_studio/`: Content Studio subsystem (experiences, activities, screens, media, validation, publishing).
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
- "Scenario" -> "Experience"
- "Scenario Builder" -> "Experience Builder"
- Keep consistent everywhere except already-committed historical migrations.
- The obsolete school-facing `content.Scenario` has been removed. The Content Studio's Experience model (`content_studio`) is now the sole experience model in the system.

## 5. FRONTEND <-> BACKEND CONTRACT
- All API calls must use `frontend/src/config.js` (`API_BASE_URL`). Never hardcode localhost/127.0.0.1 elsewhere.
- Canonical routes: All experience authoring and publishing endpoints reside in `content_studio` under `/api/v1/` (e.g. `/api/v1/content/experiences/`, `/api/v1/content/media/`, `/api/v1/dashboard/`).
- The obsolete `/api/cms/experiences/` and `/api/cms/experience-builders/` endpoints have been removed.
- School-side administration endpoints are fully versioned under `/api/cms/v1/` (e.g. `/api/cms/v1/schools/`, `/api/cms/v1/teachers/`, `/api/cms/v1/classes/`).

## 6. CURRENT STATE / KNOWN ISSUES & LIMITATIONS
- **What Works:**
  - JWT role-based authentication.
  - CRUD for Super Admins (schools, grades, school admins) and School Admins (teachers, classes, students).
  - Many-to-many linkages (teachers-classes assignment dropdown lists in creation/updates modals).
  - Validation engine (Phase 5) checking metadata, media assets, and hierarchy integrity.
  - Runtime preview (Phase 6) and absolute server asset URL payload assembly.
  - Scoped dashboard statistics driven by real database queries.
  - Cross-school scoping tenant isolation (15/15 checks fully passing).
- **Known Limitations:**
  - **Publish Content Pipeline**: Currently metadata-only (generates atomic versions on DB but actual compilation/file generation is simulated).
  - **Grading & Submissions**: No Submission or Score model exists yet (Honest empty states).
  - **Dashboard Analytics**: Engagement rate and lesson activity feed are zero/empty placeholders.

## 7. VERIFICATION COMMANDS
- **Backend:** `python manage.py check`, `python manage.py makemigrations --check --dry-run`, `python manage.py test`
- **Frontend:** `npm run build`
- **Running both servers:**
  - Backend: `python manage.py runserver` (in `backend/`)
  - Frontend: `npm run dev` (in `frontend/`)
- **Never claim success on a check you did not actually run.**

## 8. ARCHITECTURE DECISION LOG
- **Versioning Route Prefix (`/api/cms/v1/`)**: Decided on explicit URL versioning for school-side admin endpoints to allow decoupled client upgrades and future-proof iteration.
- **Scoping Boundaries**: Confirmed school-scoping filters are strictly isolated inside `super_admin`, `school_admin`, and `teacher` apps, while `content_studio` is kept global for platform-wide authoring.
- **Separate Content Studio App**: Separated all authoring/experience logic from the legacy `content` delivery system to avoid model collisions and namespace pollution.
