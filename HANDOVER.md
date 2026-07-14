# Language Lab CMS Backend System Handover Report

This document outlines the architecture, data models, endpoints, roles, and deployment configurations of the Language Lab CMS backend system (Phases 1–7).

---

## 1. System Overview & Architecture

The Language Lab CMS is a role-based educational content management system. It compiles learning materials into offline-compatible `.elab` packages, which are consumed by an Electron-based offline desktop LMS.

```mermaid
graph TD
    subgraph Django CMS Backend
        Scenario[Scenario Model]
        Activity[Activity Model]
        Screen[Screen Model]
        Media[Media Model]
        Validation[Validation Engine]
        Assembly[Preview Payload Assembly]
        Publish[Publish & Zip Pipeline]
    end

    Scenario -->|1:N| Activity
    Activity -->|1:N| Screen
    Screen -->|References| Media

    Validation -->|Inspects| Scenario
    Assembly -->|Compiles| Scenario
    Publish -->|Validates & Compresses| Scenario
    Publish -->|Outputs| ElabPackage[".elab Package (ZIP)"]
```

The Content Studio is a **global platform system** (not school-scoped), allowing authors to write educational paths without school boundaries, whereas schools and users (teachers/students/school admins) are structured inside strict organizational tenants.

---

## 2. Django Apps & Models

### A. Accounts (`accounts/`)
Manages users, permissions, and session authentication.
- **User**: Core model with roles (`SUPER_ADMIN`, `CONTENT_CREATOR`, `SCHOOL_ADMIN`, `TEACHER`, `STUDENT`).

### B. Content Studio (`content_studio/`)
Encapsulates all Scenario creation, assets, validation, and packaging features.
- **Scenario**: Learning paths (e.g., Difficulty, Estimated Duration, Subject, Grade).
- **Activity**: Reorderable steps within a Scenario.
- **Screen**: Layouts containing markdown and learning interactions (content JSON).
- **Media**: Tracked uploaded assets (images, video, audio, PDFs).
- **LearningOutcome**: Map scenarios to specific goals.
- **ValidationReport**: Stores results of validation checks.
- **PublishedPackage**: Scenario mapping table for generated versions.
- **PublishVersion**: Unique package iterations storing SHA-256 and `.elab` file paths.
- **Notification**: User activity alerts.

---

## 3. Role Permission Matrix

The system enforces role-based access control. All Content Studio APIs are protected at the view and router levels.

| Endpoint Group | Super Admin | Content Creator | School Admin | Teacher | Student |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **School & User Administration** | Read / Write | ❌ | Read / Write (Scoped) | ❌ | ❌ |
| **Scenario Builder CRUD (Phases 1–3)** | Read / Write | Read / Write | ❌ | ❌ | ❌ |
| **Media Library CRUD (Phase 4)** | Read / Write | Read / Write | ❌ | ❌ | ❌ |
| **Validation Center (Phase 5)** | Run / View | Run / View | ❌ | ❌ | ❌ |
| **Runtime Preview (Phase 6)** | Run / View | Run / View | ❌ | ❌ | ❌ |
| **Publishing & Downloads (Phase 7)** | Run / Download | Run / Download | ❌ | ❌ | ❌ |

---

## 4. Endpoints & Swagger API Documentation

API Documentation is served dynamically via **drf-spectacular**:
- **Swagger UI**: `/api/docs/` (Accessible on local server, e.g., [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/))
- **Schema JSON**: `/api/schema/`

### Grouped Endpoints

#### Scenario Builder (Phases 1 - 3)
- `GET | POST` `/api/v1/content/scenarios/` — List & Create scenarios
- `GET | PATCH | DELETE` `/api/v1/content/scenarios/{id}/` — Scenario details
- `POST` `/api/v1/content/scenarios/reorder-activities/` — Atomic display order shifting
- `GET | POST` `/api/v1/content/activities/` — List & Create activities
- `GET | PATCH | DELETE` `/api/v1/content/activities/{id}/` — Activity details
- `POST` `/api/v1/content/activities/reorder-screens/` — Screen reordering
- `GET | POST` `/api/v1/content/screens/` — Screen CRUD
- `GET | PATCH | DELETE` `/api/v1/content/screens/{id}/` — Screen details
- `POST` `/api/v1/content/screens/{id}/duplicate/` — Create identical screen copy

#### Media Library (Phase 4)
- `GET` `/api/v1/content/media/` — Search, filter, and page uploaded media assets
- `POST` `/api/v1/content/media/upload/` — Secure multipart file upload (mimetype checking)
- `POST` `/api/v1/content/media/{id}/replace/` — Overwrite binary while updating size and hash
- `DELETE` `/api/v1/content/media/{id}/` — Safe delete (checks and blocks if referenced by screens)
- `GET` `/api/v1/content/media/{id}/usage/` — Shows screens referencing this asset

#### Validation Center (Phase 5)
- `POST` `/api/v1/content/validation/{scenario_id}/run/` — Inspect scenario metadata, broken media, empty contents, and structures. Stores and returns report.
- `POST` `/api/v1/content/validation/{scenario_id}/refresh/` — Re-runs validation checks.
- `GET` `/api/v1/content/validation/{scenario_id}/` — Returns latest report.

#### Runtime Preview (Phase 6)
- `GET` `/api/v1/content/scenarios/{id}/preview/` — Dynamic payload assembly (absolute server URLs)
- `POST` `/api/v1/content/preview/start/` — Returns preview payload + session UUID
- `POST` `/api/v1/content/preview/restart/` — Restarts preview session
- `POST` `/api/v1/content/preview/stop/` — Stop session

#### Publish Center (Phase 7)
- `POST` `/api/v1/content/publish/{scenario_id}/` — Runs validation gate, compiles relative metadata, zips into `.elab` file on disk, commits atomic DB records.
- `GET` `/api/v1/content/publish/{scenario_id}/` — Returns status of published package and latest version.
- `GET` `/api/v1/content/publish/history/{scenario_id}/` — Returns all versions.
- `GET` `/api/v1/content/packages/{id}/download/` — Standard stream download (returns `FileResponse` + attachment headers).
- `POST` `/api/v1/content/packages/{id}/regenerate/` — Bumps build count and rewrites ZIP on same version.

---

## 5. Local Setup & Verification

### Prerequisites
- Python 3.10+
- PostgreSQL database
- Virtual environment setup

### Installation Steps
1. Navigate to the backend folder:
   ```bash
   cd backend/
   ```
2. Set up environment variables. Copy `.env.example` to `.env` and fill in credentials:
   ```bash
   cp .env.example .env
   ```
3. Initialize the database and run migrations:
   ```bash
   python manage.py migrate
   ```
4. Run the development server:
   ```bash
   python manage.py runserver
   ```

### Running Unit Tests
Execute the test runner:
```bash
python manage.py test
```
*Expected test count:* **76 tests**.

---

## 6. Known Issues & Legacy Failures

1. **Legacy Test Failures**:
   - `accounts.tests.CMSSchoolAdminAndTeacherTests.test_create_school_admin` (fails with status `400 != 201`).
   - `accounts.tests.RoleBasedLoginTests.test_login_student_success` (fails with status `403 != 200`).
   *Note: These tests are pre-existing accounts issues from previous development iterations and do not impact Content Studio operations.*
2. **Development Media Serving**:
   - In development mode (`DEBUG=True`), Django serves media files dynamically. In production, this must be handed off to Nginx/Apache.

---

## 7. Production Deployment Requirements

For a stable production launch:

1. **Turn off DEBUG Mode**:
   - Set `DEBUG=False` in `.env` to prevent tracebacks and security exposures.
2. **Packages Directory Routing**:
   - The `.elab` files are generated at `PACKAGES_ROOT` (defaults to `media/packages/`). In production, this directory should map to an external, persistent storage volume.
3. **Nginx Configuration**:
   - Serve static and media files directly via Nginx to optimize performance:
     ```nginx
     location /media/ {
         alias /var/www/languagelab/media/;
         client_max_body_size 50M;
     }
     ```
4. **CORS Origins Constraint**:
   - Do not use wildcard `CORS_ALLOW_ALL_ORIGINS = True` in settings. Define allowed domains in `CORS_ALLOWED_ORIGINS` inside `.env`.
5. **Database Transaction Pooler**:
   - Use connection poolers like PgBouncer for handling JWT-authenticated REST connection spikes.
