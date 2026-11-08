import express from 'express';
import {
  getCountries,
  getCountry,
  createCountry,
  updateCountry,
  deleteCountry,
  createChild,
  updateChild,
  deleteChild,
  importChecklist,
} from '../controllers/abroadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// ─── Countries ────────────────────────────────────────
router.get('/countries', getCountries);
router.post('/countries', createCountry);
router.get('/countries/:id', getCountry);
router.put('/countries/:id', updateCountry);
router.delete('/countries/:id', deleteCountry);

// ─── Sections of a country's log ──────────────────────
// :kind ∈ checklist | programs | contacts | videos | notes
// The literal import route is declared before the :kind param route.
router.post('/countries/:countryId/checklist/import', importChecklist);
router.post('/countries/:countryId/:kind', createChild);

// Standalone update/delete, like the other modules. Declared after the
// /countries/:id routes so those win for kind === 'countries'.
router.put('/:kind/:id', updateChild);
router.delete('/:kind/:id', deleteChild);

export default router;
