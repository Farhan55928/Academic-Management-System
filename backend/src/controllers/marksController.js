import MarksRecord from '../models/MarksRecord.js';

// @desc  Get all marks records for a course
// @route GET /api/courses/:courseId/marks
// @access Private
export const getMarks = async (req, res) => {
  try {
    const records = await MarksRecord.find({ course: req.params.courseId }).sort({ date: 1, createdAt: 1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Add a marks record
// @route POST /api/courses/:courseId/marks
// @access Private
export const addMarks = async (req, res) => {
  try {
    const { type, title, date, obtainedMarks, totalMarks, remark } = req.body;

    if (!type || !title || obtainedMarks === undefined || !totalMarks) {
      return res.status(400).json({ message: 'Type, title, obtainedMarks, and totalMarks are required' });
    }

    if (!['quiz', 'mid', 'assignment'].includes(type)) {
      return res.status(400).json({ message: 'Type must be quiz, mid, or assignment' });
    }

    const record = await MarksRecord.create({
      course: req.params.courseId,
      type,
      title,
      date: date || null,
      obtainedMarks,
      totalMarks,
      remark: remark || '',
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Update a marks record
// @route PUT /api/marks/:id
// @access Private
export const updateMarks = async (req, res) => {
  try {
    const { type, title, date, obtainedMarks, totalMarks, remark } = req.body;

    const record = await MarksRecord.findByIdAndUpdate(
      req.params.id,
      { type, title, date, obtainedMarks, totalMarks, remark },
      { new: true, runValidators: true }
    );

    if (!record) return res.status(404).json({ message: 'Marks record not found' });

    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Delete a marks record
// @route DELETE /api/marks/:id
// @access Private
export const deleteMarks = async (req, res) => {
  try {
    const record = await MarksRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Marks record not found' });

    res.status(200).json({ message: 'Marks record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
