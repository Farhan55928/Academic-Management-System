import express from 'express';
import { getMonths, getMonthDetails, createMonth, updateMonth, deleteMonth } from '../controllers/monthController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getMonths)
  .post(protect, createMonth);

router.route('/:id')
  .get(protect, getMonthDetails)
  .put(protect, updateMonth)
  .delete(protect, deleteMonth);

export default router;
