import StudyDay from '../models/StudyDay.js';
import StudySession from '../models/StudySession.js';
import DayOverview from '../models/DayOverview.js';

// @desc   Get all study days for the logged-in user
// @route  GET /api/study/days
export const getStudyDays = async (req, res) => {
  try {
    const days = await StudyDay.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(days);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get a single study day with its sessions and overview
// @route  GET /api/study/days/:id
export const getStudyDayDetails = async (req, res) => {
  try {
    const day = await StudyDay.findById(req.params.id);
    if (!day || day.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Study day not found' });
    }

    const sessions = await StudySession.find({ studyDayId: day._id }).sort({ startTime: 1 });
    const overview = await DayOverview.findOne({ studyDayId: day._id });

    res.json({ ...day._doc, sessions, overview });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Create a new study day
// @route  POST /api/study/days
export const createStudyDay = async (req, res) => {
  const { date } = req.body;
  try {
    // Normalize to start-of-day UTC to avoid duplicates from time component
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);

    const day = await StudyDay.create({
      userId: req.user._id,
      date: normalized
    });
    res.status(201).json(day);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A study log for this date already exists' });
    }
    res.status(400).json({ message: error.message });
  }
};

// @desc   Delete a study day and all its sessions + overview
// @route  DELETE /api/study/days/:id
export const deleteStudyDay = async (req, res) => {
  try {
    const day = await StudyDay.findById(req.params.id);
    if (!day || day.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Study day not found' });
    }

    await StudySession.deleteMany({ studyDayId: day._id });
    await DayOverview.deleteOne({ studyDayId: day._id });
    await day.deleteOne();

    res.json({ message: 'Study day and all related data removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
