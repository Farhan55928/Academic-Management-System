import express from 'express';
import multer from 'multer';
import {
  getPapers,
  getPaperById,
  uploadPaper,
  regeneratePaperSummary,
  deletePaper,
} from '../controllers/paperController.js';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// Memory storage: we stream the buffer straight to Drive, so we never
// need the file on disk. 20 MB cap matches typical paper sizes.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.use(protect);

/**
 * Some routes (upload, delete) need the user's Google Drive tokens.
 * protect() gives us a lean projection that strips them — this middleware
 * fetches the full doc and stashes it on req.user.fullUser so the
 * controllers can ignore the difference.
 */
const attachFullUser = async (req, res, next) => {
  try {
    req.user.fullUser = await User.findById(req.user._id);
    next();
  } catch (err) {
    res.status(503).json({ code: 'DB_UNAVAILABLE', message: 'Service temporarily unavailable.' });
  }
};

router.get('/',          getPapers);
router.get('/:id',       getPaperById);
router.post('/:projectId', attachFullUser, upload.single('pdf'), uploadPaper);
router.post('/:id/regenerate', attachFullUser, regeneratePaperSummary);
router.delete('/:id',    attachFullUser, deletePaper);

export default router;
