# Academic Management System (AMS) — Project Report

## Overview

**AMS** is a full-stack personal academic management web application. It helps a student track all aspects of their academic life in one place: semesters, courses, attendance, lab work, marks, study sessions, expense tracking, and a weekly backlog/to-do system.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js + Express v5 + MongoDB (Mongoose v8) |
| **Frontend** | React v19 + Vite v7 + TailwindCSS v4 + DaisyUI v5 |
| **Auth** | JWT (jsonwebtoken) + bcryptjs password hashing |
| **HTTP Client** | Axios |
| **Notifications** | react-hot-toast |
| **Routing (FE)** | react-router v7 |
| **Date Handling** | moment.js |
| **Icons** | react-icons |
| **Deployment** | Vercel (both frontend and backend have `.vercel/` dirs) |

---

## Project Structure

```
AMS/
├── backend/          ← Express API server
│   ├── server.js     ← Entry point, mounts all routes
│   └── src/
│       ├── config/         ← DB connection (connectDB)
│       ├── models/         ← 16 Mongoose schemas
│       ├── controllers/    ← 13 controller files
│       ├── routes/         ← 14 route files
│       ├── middleware/     ← authMiddleware (protect())
│       ├── utils/          ← helpers
│       └── scripts/        ← migration scripts (e.g., migrateOwnership.js)
└── frontend/         ← React SPA
    ├── index.html
    └── src/
        ├── App.jsx         ← Root + routing
        ├── api/            ← 12 per-resource Axios modules
        ├── hooks/          ← useAuth.js
        ├── pages/          ← 7 feature areas (see below)
        ├── components/
        │   ├── Layout/     ← Layout.jsx + Sidebar.jsx
        │   └── UI/         ← Modal, PageHeader, StatCard, EmptyState
        ├── routes/         ← Router.jsx (legacy, not actively used)
        ├── utils/          ← helper.js
        └── index.css       ← ~50KB of custom CSS / design tokens
```

---

## Feature Modules

### 1. 🔐 Authentication
- Email + password based; JWT stored client-side under key `ams_token`
- `useAuth.js` hook manages auth state (login/logout/isAuthenticated)
- `protect()` middleware on every protected API route
- Redirects unauthenticated users to `/login`

### 2. 📅 Semesters & Courses
- Semesters are top-level containers; courses nest within them
- `SemestersPage` → `SemesterDetailPage` → `CourseDetailPage`
- CourseDetailPage has **3 tabs**:
  - **Attendance** (`AttendanceTab.jsx`) — track class attendance per date
  - **Labs** (`LabsTab.jsx`) — lab session records
  - **Marks** (`MarksTab.jsx`) — assessment marks

### 3. 📚 Study Tracking
- `StudyDaysPage` lists all study days
- `StudyDayDetailPage` lets you log study sessions per day, with duration
- `DayOverview` — daily summary/notes per day
- Backend: `StudyDay`, `StudySession`, `DayOverview` models

### 4. 💰 Expense Tracking
- `MonthsPage` — create/manage months
- `ExpensesPage` — log and categorize expenses within a month
- Backend: `Month`, `Expense` models

### 5. 📋 Academic Backlog (Weekly To-Do)
- A 4-level nested task hierarchy: **Week → Section → Subsection → Step**
- `BacklogWeeksPage` — list all backlog weeks (filterable by semester)
- `BacklogWeekDetailPage` — full tree view with inline editing
- **Smart completion**: ticking a step auto-completes parent nodes; ticking a parent cascades down to children
- Subsections with no steps act as manually-ticked leaf tasks
- `backlogController.js` (17 KB) is the most complex controller — runs `recomputeSubsection → recomputeSection → recomputeWeek` chain on every mutation
- Reorder endpoint: `PUT /api/backlog/reorder { type, ids }`

### 6. 🏠 Dashboard
- `DashboardPage` — aggregated overview of academic stats
- Dedicated `dashboardController.js` that queries multiple models

---

## API Design Pattern

The backend uses **nested routing for hierarchical resources** and **standalone routes for PUT/DELETE**:

```
GET/POST   /api/semesters
GET/POST   /api/semesters/:semesterId/courses
PUT/DELETE /api/courses/:id          ← standalone
GET/POST   /api/courses/:courseId/attendance
PUT/DELETE /api/attendance/:id       ← standalone
... same pattern for labs, marks, study sessions

GET/POST   /api/study/days
GET/POST   /api/study/days/:dayId/sessions
GET/PUT    /api/study/days/:dayId/overview

GET/POST   /api/months
GET/POST/PUT/DELETE /api/expenses

/api/backlog/*  ← all levels share same prefix, all in backlogRoutes.js
```

All routes except `/api/auth` and `/` are protected by `protect()`.

---

## Data Models (16 Mongoose Schemas)

| Model | Purpose |
|---|---|
| `User` | Email + hashed password |
| `Semester` | Academic semester |
| `Course` | Course under a semester (user-scoped) |
| `AttendanceRecord` | Per-course class attendance |
| `LabRecord` | Per-course lab session |
| `MarksRecord` | Per-course assessment marks |
| `StudyDay` | A study day container |
| `StudySession` | A timed study session within a day |
| `DayOverview` | Daily notes/summary |
| `Month` | Expense month container |
| `Expense` | Individual expense entry |
| `BacklogWeek` | Top-level weekly work container |
| `BacklogSection` | Section within a week |
| `BacklogSubsection` | Subsection within a section |
| `BacklogStep` | Leaf task step |
| `Member` | Shared resource (minor/utility) |

---

## Frontend Architecture

- **Single Page App** with client-side routing via `react-router`
- **Auth guard** in `App.jsx` — unauthenticated users only see `/login`
- **`api/axios.js`** is the shared Axios instance; it automatically attaches `Authorization: Bearer <ams_token>` to every request
- Each feature has its own API module (e.g., `api/semesters.js`, `api/backlog.js`)
- **`Axios/` folder is dead code** (documented in CLAUDE.md) — reads the wrong token key; should not be used
- The `src/routes/Router.jsx` file appears to be a legacy/unused file — actual routing is done directly in `App.jsx`
- `index.css` is huge (~50 KB) — contains the full design system with CSS custom properties

---

## Known Issues / Technical Debt

| Issue | Details |
|---|---|
| Dead code | `frontend/src/Axios/` folder — `UseAxiosSecure` reads wrong token key |
| Legacy file | `frontend/src/routes/Router.jsx` — only defines 3 basic routes, not used by `App.jsx` |
| No test suite | Backend `package.json` has a placeholder `"test"` script only |
| CORS | Globally enabled with default settings; should be restricted for production |

---

## Deployment

Both the backend and frontend have `.vercel/` directories indicating they are deployed to **Vercel**:
- Frontend: static React build via Vite
- Backend: `vercel.json` configures serverless Express deployment
- Frontend uses `.env.production` pointing to the deployed API URL

---

## Development Commands

```bash
# Backend (port 9000)
cd backend && npm run dev

# Frontend (port 5173, HMR)
cd frontend && npm run dev
```
