import express from 'express';
import {
  getWeeks,
  getWeekDetails,
  createWeek,
  updateWeek,
  deleteWeek,
  createSection,
  updateSection,
  deleteSection,
  createSubsection,
  updateSubsection,
  deleteSubsection,
  createStep,
  updateStep,
  deleteStep,
  reorder,
} from '../controllers/backlogController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Declared before the /:id param routes so it isn't swallowed by one
router.put('/reorder', reorder);

// ─── Weeks ────────────────────────────────────────────
router.get('/weeks', getWeeks);
router.post('/weeks', createWeek);
router.get('/weeks/:id', getWeekDetails);
router.put('/weeks/:id', updateWeek);
router.delete('/weeks/:id', deleteWeek);

// ─── Sections (created nested under a week) ───────────
router.post('/weeks/:weekId/sections', createSection);
router.put('/sections/:id', updateSection);
router.delete('/sections/:id', deleteSection);

// ─── Subsections (created nested under a section) ─────
router.post('/sections/:sectionId/subsections', createSubsection);
router.put('/subsections/:id', updateSubsection);
router.delete('/subsections/:id', deleteSubsection);

// ─── Steps (created nested under a subsection) ────────
router.post('/subsections/:subsectionId/steps', createStep);
router.put('/steps/:id', updateStep);
router.delete('/steps/:id', deleteStep);

export default router;
