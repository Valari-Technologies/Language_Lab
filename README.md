# LinguaLab: Role-Based Educational CMS

LinguaLab is a modern, production-ready educational Content Management System (CMS) designed for language learning. It provides scoped, role-based workflows for administrators, content creators, and teachers, facilitating the creation, validation, and delivery of language training packages.

---

## 🌟 Key Features

### 1. Multi-Tenant Scoped Architecture
- **Super Admin:** Global control over schools, subscriptions, grades, and global settings.
- **School Admin:** Scoping boundaries to manage a specific school tenant's teachers, classes, and students.
- **Teacher:** Scoped class management, scenario assignment, and tracking within their assigned classes.
- **Content Creator:** Global platform-wide access to the **Content Studio** for authoring educational materials.

### 2. The Content Studio (Experience Builder)
- **Experience Builder:** Create, edit, and organize learning experiences.
- **Activity & Screen Builder:** Build interactive screens using a free-form layout canvas.
  - **Absolute Positioning:** Drag and place elements manually in free spaces.
  - **Left-to-Right & Corner Resizing:** Intuitively adjust element widths and heights.
  - **Dynamic Elements:** Support for headings, text blocks, images, audio clips, video links, quizzes, and more.
- **Validation Engine:** Real-time backend validation ensuring package integrity (verifies titles, grades, thumbnail images, activities, learning outcomes, and media).
- **Runtime Preview:** Visual simulator replicating the exact desktop LMS application wrapper layout.
- **Package Compilation:** Publish compile pipeline generating atomic versions.

### 3. Secure Architecture
- **JWT (SimpleJWT) Authentication:** Role-based secure token-based logins with httpOnly secure cookies.
- **Strict Profile Checks:** Orphaned users without active profile records are blocked from signing in.

---

## 🛠️ Technology Stack

### Backend
- **Core:** Python, Django
- **API Surface:** Django REST Framework (DRF)
- **Database:** PostgreSQL (production), SQLite (test/dev local fallback)
- **Authentication:** SimpleJWT (JSON Web Tokens)

### Frontend
- **Core:** JavaScript (ES6+), React 18, Vite
- **Styling:** Vanilla CSS (curated HSL palettes, smooth micro-animations, glassmorphism)
- **Icons:** React Icons

---

## 📂 Repository Layout

```text
Language_lab/
├── backend/
│   ├── config/              # Django project settings & URL routing
│   ├── accounts/            # User models, authentication, and token managers
│   ├── school_admin/        # School management, teachers, classes, and schedules
│   ├── teacher/             # Teacher tools and student profile handlers
│   ├── content_studio/      # Experiences, activities, screens, validation, & compilers
│   ├── manage.py            # Django CLI management entrypoint
│   └── requirements.txt     # Python backend dependencies
└── frontend/
    ├── src/
    │   ├── main.jsx         # React application root & router
    │   ├── ContentStudio.jsx# Interactive screen builder & compiler views
    │   ├── Dashboard.jsx    # Super Admin Dashboard
    │   ├── SchoolDashboard.jsx # School Admin Dashboard
    │   ├── TeacherDashboard.jsx # Teacher portal
    │   ├── Login.jsx        # Login & Google OAuth endpoint
    │   └── config.js        # API endpoint configurations
    ├── package.json         # Node.js dependencies
    └── vite.config.js       # Vite build configurations
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**

---

### Backend Setup

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Activate the virtual environment:**
   - **Windows:**
     ```powershell
     .\venv\Scripts\activate
     ```
   - **macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations and start the Django server:**
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

---

### Frontend Setup

1. **Navigate to the frontend folder:**
   ```bash
   cd ../frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

---

## Demo Seed Runner Notes

Use the demo seed after migrations when setting up a fresh local, staging, or demo machine. The command is idempotent, so it can be rerun safely to recreate/update the demo school, roles, classes, sample Content Studio experience, assignment, and attempt data.

### Local Docker
```bash
docker compose run --rm backend sh -c "python manage.py migrate && python manage.py seed_demo_data"
```

### Production Docker
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend python manage.py seed_demo_data
```

### Demo Credentials
```text
Super Admin      username=super_admin      password=SuperAdmin@123
Content Creator  username=content_creator  password=Creator@123
School Admin     username=school_admin     password=SchoolAdmin@123
Teacher          username=teacher_demo     password=Teacher@123
Student/LMS      username=DEMO001          password=DEMO001
```

For existing demo environments where passwords should not be reset, run:
```bash
python manage.py seed_demo_data --no-reset-passwords
```

---

## 🧪 Verification Commands

Before deploying or pushing changes, ensure the build and tests pass cleanly:

### Run Backend Tests
```bash
python manage.py test
```

### Run Frontend Production Build
```bash
npm run build
```
