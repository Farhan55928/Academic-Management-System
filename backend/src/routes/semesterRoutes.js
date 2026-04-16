import express from 'express';
import {
  getSemesters,
  createSemester,
  updateSemester,
  deleteSemester,
  activateSemester,
} from '../controllers/semesterController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getSemesters);
router.post('/', createSemester);
router.put('/:id', updateSemester);
router.delete('/:id', deleteSemester);
router.patch('/:id/activate', activateSemester);

export default router;
