import express from 'express';
import {
  getMarks,
  addMarks,
  updateMarks,
  deleteMarks,
} from '../controllers/marksController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

// Nested under /api/courses/:courseId/marks
router.get('/', getMarks);
router.post('/', addMarks);

// Standalone: /api/marks/:id
router.put('/:id', updateMarks);
router.delete('/:id', deleteMarks);

export default router;
