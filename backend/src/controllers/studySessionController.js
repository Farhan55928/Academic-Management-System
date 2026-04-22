import StudySession from '../models/StudySession.js';
import StudyDay from '../models/StudyDay.js';

// Helper: parse "HH:MM" to minutes since midnight
const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// @desc   Get all sessions for a study day
// @route  GET /api/study/days/:dayId/sessions
export const getSessionsByDay = async (req, res) => {
  try {
    const day = await StudyDay.findById(req.params.dayId);
    if (!day || day.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Study day not found' });
    }

    const sessions = await StudySession.find({ studyDayId: day._id }).sort({ startTime: 1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Create a new study session with auto-generated hour blocks
// @route  POST /api/study/days/:dayId/sessions
export const createSession = async (req, res) => {
  const { startTime, endTime, hourBlocks } = req.body;
  try {
    const day = await StudyDay.findById(req.params.dayId);
    if (!day || day.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Study day not found' });
    }

    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);
    const durationHours = Math.round((endMin - startMin) / 60);

    if (durationHours < 1 || durationHours > 4) {
      return res.status(400).json({ message: 'Session must be between 1 and 4 hours' });
    }
    if (endMin <= startMin) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Build hour blocks: use provided data or create empty stubs
    const blocks = Array.from({ length: durationHours }, (_, i) => ({
      blockIndex: i,
      topic: hourBlocks?.[i]?.topic ?? '',
      wasted: hourBlocks?.[i]?.wasted ?? false,
      note: hourBlocks?.[i]?.note ?? ''
    }));

    const session = await StudySession.create({
      userId: req.user._id,
      studyDayId: day._id,
      startTime,
      endTime,
      durationHours,
      hourBlocks: blocks
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc   Update a study session and its hour blocks
// @route  PUT /api/study/sessions/:id
export const updateSession = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);
    if (!session || session.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const { startTime, endTime, hourBlocks } = req.body;

    if (startTime && endTime) {
      const startMin = toMinutes(startTime);
      const endMin = toMinutes(endTime);
      const durationHours = Math.round((endMin - startMin) / 60);

      if (durationHours < 1 || durationHours > 4) {
        return res.status(400).json({ message: 'Session must be between 1 and 4 hours' });
      }
      if (endMin <= startMin) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }

      session.startTime = startTime;
      session.endTime = endTime;
      session.durationHours = durationHours;
      session.hourBlocks = Array.from({ length: durationHours }, (_, i) => ({
        blockIndex: i,
        topic: hourBlocks?.[i]?.topic ?? '',
        wasted: hourBlocks?.[i]?.wasted ?? false,
        note: hourBlocks?.[i]?.note ?? ''
      }));
    } else if (hourBlocks) {
      session.hourBlocks = hourBlocks;
    }

    const updated = await session.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc   Delete a study session
// @route  DELETE /api/study/sessions/:id
export const deleteSession = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);
    if (!session || session.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Session not found' });
    }

    await session.deleteOne();
    res.json({ message: 'Session removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
