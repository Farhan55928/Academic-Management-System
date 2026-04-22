import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';

// Routes
import authRoutes from './src/routes/authRoutes.js';
import semesterRoutes from './src/routes/semesterRoutes.js';
import courseRoutes from './src/routes/courseRoutes.js';
import attendanceRoutes from './src/routes/attendanceRoutes.js';
import labRoutes from './src/routes/labRoutes.js';
import marksRoutes from './src/routes/marksRoutes.js';
import expenseRoutes from './src/routes/expenseRoutes.js';
import monthRoutes from './src/routes/monthRoutes.js';
import studyDayRoutes from './src/routes/studyDayRoutes.js';
import studySessionRoutes from './src/routes/studySessionRoutes.js';
import dayOverviewRoutes from './src/routes/dayOverviewRoutes.js';

// Standalone routes (for update/delete by ID, not nested)
import { protect } from './src/middleware/authMiddleware.js';
import { updateCourse, deleteCourse } from './src/controllers/courseController.js';
import { updateAttendance, deleteAttendance } from './src/controllers/attendanceController.js';
import { updateLab, deleteLab } from './src/controllers/labController.js';
import { updateMarks, deleteMarks } from './src/controllers/marksController.js';
import { updateSession, deleteSession } from './src/controllers/studySessionController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Academic Management System API is running 🎓' });
});

// ─── Auth ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── Semesters ────────────────────────────────────────
app.use('/api/semesters', semesterRoutes);

// ─── Courses (nested under semesters) ─────────────────
app.use('/api/semesters/:semesterId/courses', courseRoutes);

// ─── Courses (standalone for PUT/DELETE) ──────────────
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


// ─── Start ────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} 🚀`);
  });
});
