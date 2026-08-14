# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Academic Management System** — a full-stack web application for managing academic activities including semesters, courses, attendance, marks, labs, expenses, and study tracking.

- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Frontend**: React (v19) + Vite + TailwindCSS + DaisyUI
- **Auth**: JWT-based authentication with bcryptjs password hashing

## Development Setup

### Backend

```bash
cd backend
npm install
npm run dev          # Start dev server with nodemon (watches for changes)
npm start            # Start production server
```

**Environment variables** (`backend/.env`):
- `Mongo_URI` — MongoDB connection string
- `PORT` — Server port (default: 9000)
- `ACCESS_TOKEN_SECRET` — JWT secret for signing tokens

### Frontend

```bash
cd frontend
npm install
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## Architecture

### Backend Structure

```
backend/src/
├── config/          # Database configuration
├── models/          # Mongoose schemas
├── controllers/     # Request handlers (one per resource)
├── routes/          # Express route definitions
├── middleware/      # Auth and request middleware
├── utils/           # Helper functions
└── scripts/         # Utility scripts (migrations, seeding)
```

### API Design

The API uses a **nested routing pattern** for hierarchical resources:

```
Semesters (top level)
  ├── /api/semesters                              [GET/POST]
  ├── /api/semesters/:id                          [GET/PUT/DELETE]
  │
  └── Courses (nested under semester)
      ├── /api/semesters/:semesterId/courses      [GET/POST]
      ├── /api/courses/:id                        [PUT/DELETE standalone]
      │
      ├── Attendance (nested under course)
      │   ├── /api/courses/:courseId/attendance   [GET/POST]
      │   └── /api/attendance/:id                 [PUT/DELETE standalone]
      │
      ├── Labs (nested under course)
      │   ├── /api/courses/:courseId/labs         [GET/POST]
      │   └── /api/labs/:id                       [PUT/DELETE standalone]
      │
      └── Marks (nested under course)
          ├── /api/courses/:courseId/marks        [GET/POST]
          └── /api/marks/:id                      [PUT/DELETE standalone]

Study Management
├── /api/study/days                               [GET/POST]
├── /api/study/days/:dayId/sessions              [GET/POST]
├── /api/study/sessions/:id                      [PUT/DELETE standalone]
└── /api/study/days/:dayId/overview              [GET/PUT]

Expenses
├── /api/months                                  [GET/POST]
└── /api/expenses                                [GET/POST/PUT/DELETE]

Academic Backlog (Week → Section → Subsection → Step)
├── /api/backlog/weeks                              [GET list?semesterId= / POST]
├── /api/backlog/weeks/:id                          [GET full tree / PUT / DELETE]
├── /api/backlog/weeks/:weekId/sections             [POST]
├── /api/backlog/sections/:id                       [PUT/DELETE standalone]
├── /api/backlog/sections/:sectionId/subsections    [POST]
├── /api/backlog/subsections/:id                    [PUT/DELETE standalone]
├── /api/backlog/subsections/:subsectionId/steps    [POST]
├── /api/backlog/steps/:id                          [PUT/DELETE standalone]
└── /api/backlog/reorder                            [PUT { type, ids }]

Auth
└── /api/auth                                    [POST login/register]
```

Note: unlike the other modules, the backlog's standalone PUT/DELETE routes live in
`backlogRoutes.js` rather than `server.js` — every level shares the `/api/backlog`
prefix, so registering them separately would run `protect` twice per request.

### Key Models

- **User**: Email-based auth with bcrypt hashed passwords
- **Semester**: Academic semester container
- **Course**: Courses under a semester (owned by user)
- **Attendance/Lab/Marks**: Course-specific records
- **StudyDay/StudySession**: Study tracking with daily overviews
- **Month/Expense**: Expense tracking by month
- **BacklogWeek/BacklogSection/BacklogSubsection/BacklogStep**: Weekly pending-work checklist. Steps are the source of truth for completion; `backlogController.js` holds a `recomputeSubsection → recomputeSection → recomputeWeek` chain that every mutation calls into, so ticking the last step auto-completes its parents. Ticking a parent cascades down instead. A subsection with no steps is a manually-ticked leaf task. Children denormalize `weekId` so the tree loads and cascade-deletes in flat queries.
- **Member**: Shared resource (used in some modules)

### Authentication

- **Middleware**: `authMiddleware.js` — `protect()` verifies JWT bearer tokens
- **Token claims**: `{ id: userId }`
- **Token storage**: Sent in request header: `Authorization: Bearer <token>`
- **Resource ownership**: Courses and study records are user-scoped; verify `req.user._id` matches ownership

### Frontend Structure

```
frontend/src/
├── pages/           # Full-page components (Semesters, Courses, Study, Expenses)
├── components/      # Reusable UI components (Modal, StatCard, PageHeader, Sidebar)
├── routes/          # Router configuration
├── api/             # Axios instance (api/axios.js) + one module per resource
├── Axios/           # DEAD CODE — UseAxiosSecure reads the wrong token key; do not use
├── utils/           # Helper functions
└── main.jsx         # React entry point
```

### Key Pages

- **Login/SignUp**: Authentication pages
- **DashboardPage**: Home page with overview
- **SemestersPage/SemesterDetailPage**: Semester and course management
- **CourseDetailPage**: Tabs for Attendance, Labs, Marks
- **StudyDaysPage/StudyDayDetailPage**: Study tracking
- **MonthsPage/ExpensesPage**: Expense tracking

## Common Development Tasks

### Adding a new API endpoint

1. Create a **model** in `backend/src/models/` (if needed)
2. Create a **controller** in `backend/src/controllers/` with handler functions
3. Create or update **routes** in `backend/src/routes/`
4. Register routes in `backend/server.js` (use nested routes for hierarchical resources)
5. Add **middleware** as needed (e.g., `protect` for auth-required endpoints)

Example controller structure:
```javascript
export const getAllResources = async (req, res) => {
  try {
    const data = await Model.find({ userId: req.user._id });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### Adding a new frontend page

1. Create component in `frontend/src/pages/<Feature>/`
2. Add route to `frontend/src/routes/Router.jsx`
3. Add a per-resource module in `src/api/` that imports the shared `api/axios.js` instance (it attaches the `ams_token` bearer header automatically)
4. Style with TailwindCSS + DaisyUI

Example API call:
```javascript
// src/api/semesters.js
import api from './axios.js';
export const getSemesters = () => api.get('/semesters');

// in a page component
const { data } = await getSemesters();
```

### Database seeding

Use `backend/src/seed.js` for initial data. Run with Node:
```bash
cd backend && node src/seed.js
```

### Data migrations

Utility scripts are in `backend/src/scripts/`. Example: `migrateOwnership.js` handles ownership reassignment.

## Important Notes

- **User context**: Most queries should filter by `req.user._id` to ensure data isolation
- **Error handling**: Controllers should catch errors and return appropriate HTTP status codes
- **Mongoose schemas**: Define validation and default values in the schema to keep controllers clean
- **JWT secret**: Must be long and random; never commit `.env` with real secrets
- **CORS**: Enabled globally in `server.js`; adjust as needed for production
- **Vite dev server**: Runs on port 5173 by default (hot module replacement enabled)
- **Recent feature**: Study tracking system added with StudyDay, StudySession, and DayOverview models
