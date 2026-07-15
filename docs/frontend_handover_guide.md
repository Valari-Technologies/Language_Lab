# Frontend Developer Integration & API Guide

Welcome to the Language Lab CMS API. This document explains how to set up, authenticate, and integrate your frontend codebase with the Django REST backend.

---

## 1. API Schema & Postman Collection
The latest OpenAPI 3.0 schema has been generated and saved in the repository:
* **File Path:** `docs/openapi_schema.json`

### Import into Postman:
1. Open **Postman**.
2. Click **Import** (top left).
3. Drag & drop the `docs/openapi_schema.json` file.
4. Select the **"Generate a Postman Collection"** option.
5. Click **Import**. This will instantly create a folder structure with pre-configured headers, query parameters, and example body structures for all endpoints.

---

## 2. Interactive Swagger UI
When running the Django backend server locally, you can access dynamic interactive documentation:
* **Swagger UI:** `http://127.0.0.1:8000/api/docs/`
* **Raw OpenAPI JSON Spec:** `http://127.0.0.1:8000/api/schema/`

---

## 3. Local Backend Setup
To run the server locally for real-time testing:
1. Ensure Python 3.10+ is installed.
2. Navigate to `backend/` and activate the virtual environment:
   * **Windows (PowerShell):** `.\venv\Scripts\Activate.ps1`
   * **macOS / Linux:** `source venv/bin/activate`
3. Run migrations and start the server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
4. Access the API at `http://127.0.0.1:8000/`.

---

## 4. Authentication (JWT)
All protected endpoints require a valid JSON Web Token (JWT) passed in the `Authorization` header.

### Unified Login Flow:
* **Endpoint:** `POST /api/auth/login/`
* **Payload Format:**
  ```json
  {
      "username": "user_identifier",
      "password": "user_password",
      "role": "ROLE_NAME"
  }
  ```
  *(Supported Roles: `SUPER_ADMIN`, `CONTENT_CREATOR`, `SCHOOL_ADMIN`, `TEACHER`, `STUDENT`)*

* **Response:**
  ```json
  {
      "access": "YOUR_JWT_ACCESS_TOKEN",
      "refresh": "YOUR_JWT_REFRESH_TOKEN",
      "user": {
          "id": 1,
          "username": "username",
          "role": "ROLE_NAME",
          "full_name": "Full Name",
          "email": "user@example.com"
      }
  }
  ```

### Using the Token in Request Headers:
Add the `access` token to subsequent HTTP requests as a Bearer token:
```http
Authorization: Bearer YOUR_JWT_ACCESS_TOKEN
```

### Refresh Token:
To refresh expired access tokens, send a `POST` request with the refresh token:
* **Endpoint:** `POST /api/auth/refresh/`
* **Payload:** `{"refresh": "YOUR_JWT_REFRESH_TOKEN"}`
* **Response:** `{"access": "NEW_ACCESS_TOKEN"}`

---

## 5. Roles & Scope Matrix
Ensure your frontend UI routes, sidebars, and actions respect the role constraints:

| Scope | Allowed Roles | Description / Functionality |
| :--- | :--- | :--- |
| **System Admin** | `SUPER_ADMIN` | Management of Schools, Grades, and School Admins. |
| **School Admin** | `SCHOOL_ADMIN` | Management of Teachers, Classes, and School Configurations. Scoped strictly to their own school. |
| **Scenario Studio** | `SUPER_ADMIN`, `CONTENT_CREATOR` | Global scenario creator platform (Scenarios, Activities, Screens, Media, Publish packages). |
| **Teacher Console** | `TEACHER` | Dashboard view of classes, student management, and scenario assignments. |
| **Student** | `STUDENT` | Accesses assigned scenarios. |

---

## 6. CORS Configurations
If your frontend development server runs on a custom port or domain (e.g., `http://localhost:3000`), update the `.env` file in the backend folder:
```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```
This is required to prevent cross-origin resource sharing errors when making API calls.
