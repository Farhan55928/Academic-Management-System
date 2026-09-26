import express from 'express';
import { getUploadSignature, deleteImage } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/signature', getUploadSignature);
router.delete('/', deleteImage);

export default router;
