import express from 'express';
import { getSessionsByDay, createSession } from '../controllers/studySessionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true }); // mergeParams to access :dayId

router.route('/')
  .get(protect, getSessionsByDay)
  .post(protect, createSession);

export default router;
