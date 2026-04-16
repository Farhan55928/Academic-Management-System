import express from 'express';
import {
  getAttendance,
  addAttendance,
  updateAttendance,
  deleteAttendance,
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

// Nested under /api/courses/:courseId/attendance
router.get('/', getAttendance);
router.post('/', addAttendance);

// Standalone: /api/attendance/:id
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

export default router;
