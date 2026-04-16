import express from 'express';
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/courseController.js';
import { protect } from '../middleware/authMiddleware.js';

// mergeParams allows access to :semesterId from the parent router
const router = express.Router({ mergeParams: true });

router.use(protect);

// Routes scoped under /api/semesters/:semesterId/courses
router.get('/', getCourses);
router.post('/', createCourse);

// Standalone course routes mounted at /api/courses
router.put('/:id', updateCourse);
router.delete('/:id', deleteCourse);

export default router;
