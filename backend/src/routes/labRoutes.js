import express from 'express';
import {
  getLabs,
  addLab,
  updateLab,
  deleteLab,
} from '../controllers/labController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

// Nested under /api/courses/:courseId/labs
router.get('/', getLabs);
router.post('/', addLab);

// Standalone: /api/labs/:id
router.put('/:id', updateLab);
router.delete('/:id', deleteLab);

export default router;
