import express from 'express';
import { getOverview, createOrUpdateOverview, deleteOverview } from '../controllers/dayOverviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true }); // mergeParams to access :dayId

router.route('/')
  .get(protect, getOverview)
  .post(protect, createOrUpdateOverview)
  .delete(protect, deleteOverview);

export default router;
