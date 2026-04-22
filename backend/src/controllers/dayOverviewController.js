import DayOverview from '../models/DayOverview.js';
import StudyDay from '../models/StudyDay.js';

// @desc   Get the overview for a study day
// @route  GET /api/study/days/:dayId/overview
export const getOverview = async (req, res) => {
  try {
    const day = await StudyDay.findById(req.params.dayId);
    if (!day || day.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Study day not found' });
    }

    const overview = await DayOverview.findOne({ studyDayId: day._id });
    if (!overview) {
      return res.status(404).json({ message: 'No overview found for this day' });
    }

    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Create or update the overview for a study day (upsert)
// @route  POST /api/study/days/:dayId/overview
export const createOrUpdateOverview = async (req, res) => {
  const { rating, reflection, improveZone } = req.body;
  try {
    const day = await StudyDay.findById(req.params.dayId);
    if (!day || day.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Study day not found' });
    }

    const overview = await DayOverview.findOneAndUpdate(
      { studyDayId: day._id },
      { userId: req.user._id, studyDayId: day._id, rating, reflection, improveZone },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(overview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc   Delete the overview for a study day
// @route  DELETE /api/study/days/:dayId/overview
export const deleteOverview = async (req, res) => {
  try {
    const day = await StudyDay.findById(req.params.dayId);
    if (!day || day.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Study day not found' });
    }

    await DayOverview.deleteOne({ studyDayId: day._id });
    res.json({ message: 'Overview removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
