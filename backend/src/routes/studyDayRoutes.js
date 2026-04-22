import express from 'express';
import { getStudyDays, getStudyDayDetails, createStudyDay, deleteStudyDay } from '../controllers/studyDayController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getStudyDays)
  .post(protect, createStudyDay);

router.route('/:id')
  .get(protect, getStudyDayDetails)
  .delete(protect, deleteStudyDay);

export default router;
