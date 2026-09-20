import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, dbState } from './config/db.js';
import { ensureDb } from './middleware/dbMiddleware.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import semesterRoutes from './routes/semesterRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import labRoutes from './routes/labRoutes.js';
import marksRoutes from './routes/marksRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import monthRoutes from './routes/monthRoutes.js';
import studyDayRoutes from './routes/studyDayRoutes.js';
import studySessionRoutes from './routes/studySessionRoutes.js';
import dayOverviewRoutes from './routes/dayOverviewRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import backlogRoutes from './routes/backlogRoutes.js';
import researchProjectRoutes from './routes/researchProjectRoutes.js';
import paperRoutes from './routes/paperRoutes.js';

// Standalone routes (for update/delete by ID, not nested)
import { protect } from './middleware/authMiddleware.js';
import { updateCourse, deleteCourse, getCourseById } from './controllers/courseController.js';
import { updateAttendance, deleteAttendance } from './controllers/attendanceController.js';
import { updateLab, deleteLab } from './controllers/labController.js';
import { updateMarks, deleteMarks } from './controllers/marksController.js';
import { updateSession, deleteSession } from './controllers/studySessionController.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Pure liveness probe — must stay reachable even if the DB is down.
app.get('/', (req, res) => {
  res.json({ message: 'Academic Management System API is running 🎓' });
});

// Diagnostics: confirms the connection cache is actually being reused across
// invocations (connectMs should be ~0 on a warm lambda vs a cold one).
app.get('/api/health', async (req, res) => {
  const t0 = Date.now();
  try {
    await connectDB();
    await mongoose.connection.db.admin().command({ ping: 1 });
    res.json({ ok: true, readyState: dbState(), connectMs: Date.now() - t0 });
  } catch (error) {
    res.status(503).json({ ok: false, code: 'DB_UNAVAILABLE', error: error.message, ms: Date.now() - t0 });
  }
});

// Every route below this line needs the database.
app.use(ensureDb);

// ─── Dashboard (aggregated) ───────────────────────────
app.use('/api/dashboard', dashboardRoutes);

// ─── Auth ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── Semesters ────────────────────────────────────────
app.use('/api/semesters', semesterRoutes);

// ─── Courses (nested under semesters) ─────────────────
app.use('/api/semesters/:semesterId/courses', courseRoutes);

// ─── Courses (standalone for GET/PUT/DELETE) ──────────
app.get('/api/courses/:id', protect, getCourseById);
app.put('/api/courses/:id', protect, updateCourse);
app.delete('/api/courses/:id', protect, deleteCourse);

// ─── Attendance (nested under courses) ────────────────
app.use('/api/courses/:courseId/attendance', attendanceRoutes);

// ─── Attendance (standalone for PUT/DELETE) ───────────
app.put('/api/attendance/:id', protect, updateAttendance);
app.delete('/api/attendance/:id', protect, deleteAttendance);

// ─── Labs (nested under courses) ──────────────────────
app.use('/api/courses/:courseId/labs', labRoutes);

// ─── Labs (standalone for PUT/DELETE) ─────────────────
app.put('/api/labs/:id', protect, updateLab);
app.delete('/api/labs/:id', protect, deleteLab);

// ─── Marks (nested under courses) ─────────────────────
app.use('/api/courses/:courseId/marks', marksRoutes);

// ─── Marks (standalone for PUT/DELETE) ────────────────
app.put('/api/marks/:id', protect, updateMarks);
app.delete('/api/marks/:id', protect, deleteMarks);

// ─── Expenses ─────────────────────────────────────────
app.use('/api/months', monthRoutes);
app.use('/api/expenses', expenseRoutes);

// ─── Study Management ─────────────────────────────────
app.use('/api/study/days', studyDayRoutes);
app.use('/api/study/days/:dayId/sessions', studySessionRoutes);
app.use('/api/study/days/:dayId/overview', dayOverviewRoutes);

// ─── Study Sessions (standalone for PUT/DELETE) ───────
app.put('/api/study/sessions/:id', protect, updateSession);
app.delete('/api/study/sessions/:id', protect, deleteSession);

// ─── Academic Backlog ─────────────────────────────────
// Every level shares the /api/backlog prefix, so the standalone PUT/DELETE
// routes live inside backlogRoutes.js rather than being repeated here.
app.use('/api/backlog', backlogRoutes);

// ─── Research Logs ────────────────────────────────────
app.use('/api/research/projects', researchProjectRoutes);
app.use('/api/research/papers', paperRoutes);

// ─── Global error handler ──────────────────────────────
// Express 5 forwards rejected async-handler promises here automatically.
// A DB-layer failure that slips past ensureDb (e.g. the connection drops
// mid-request) must still surface as 503, never as a generic 500 — the
// frontend's retry/error-messaging logic keys off that status code.
app.use((err, req, res, next) => {
  const infra =
    err?.name === 'MongooseServerSelectionError' ||
    err?.name === 'MongoNetworkError' ||
    err?.name === 'MongoTimeoutError' ||
    /buffering timed out|was disconnected|Client must be connected/i.test(err?.message ?? '');

  if (infra) {
    console.error('[db] query failed:', err.message);
    return res.status(503).json({
      code: 'DB_UNAVAILABLE',
      message: 'Service temporarily unavailable. Please try again.',
    });
  }

  console.error(err);
  res.status(err.status || 500).json({ code: 'SERVER_ERROR', message: 'Server error' });
});

export default app;
