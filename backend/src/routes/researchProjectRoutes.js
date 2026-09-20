import express from 'express';
import {
  getProjects,
  addProject,
  updateProject,
  deleteProject,
} from '../controllers/researchProjectController.js';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();
router.use(protect);

// Delete needs the full user to clean up Drive files.
const attachFullUser = async (req, res, next) => {
  try {
    req.user.fullUser = await User.findById(req.user._id);
    next();
  } catch (err) {
    res.status(503).json({ code: 'DB_UNAVAILABLE', message: 'Service temporarily unavailable.' });
  }
};

router.get('/',     getProjects);
router.post('/',    addProject);
router.put('/:id',  updateProject);
router.delete('/:id', attachFullUser, deleteProject);

export default router;
