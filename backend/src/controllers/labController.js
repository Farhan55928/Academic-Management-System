import LabRecord from '../models/LabRecord.js';

// @desc  Get all lab records for a course
// @route GET /api/courses/:courseId/labs
// @access Private
export const getLabs = async (req, res) => {
  try {
    const records = await LabRecord.find({ course: req.params.courseId }).sort({ labNumber: 1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Add a lab record
// @route POST /api/courses/:courseId/labs
// @access Private
export const addLab = async (req, res) => {
  try {
    const { labNumber, title, date, taskStatus, taskRemark, reportStatus, reportRemark, reportMarks } = req.body;

    if (!labNumber || !title) {
      return res.status(400).json({ message: 'Lab number and title are required' });
    }

    const record = await LabRecord.create({
      course: req.params.courseId,
      labNumber,
      title,
      date: date || null,
      taskStatus: taskStatus || 'pending',
      taskRemark: taskRemark || '',
      reportStatus: reportStatus || 'pending',
      reportRemark: reportRemark || '',
      reportMarks: reportMarks !== undefined ? reportMarks : null,
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Update a lab record
// @route PUT /api/labs/:id
// @access Private
export const updateLab = async (req, res) => {
  try {
    const { labNumber, title, date, taskStatus, taskRemark, reportStatus, reportRemark, reportMarks } = req.body;

    const record = await LabRecord.findByIdAndUpdate(
      req.params.id,
      { labNumber, title, date, taskStatus, taskRemark, reportStatus, reportRemark, reportMarks },
      { new: true, runValidators: true }
    );

    if (!record) return res.status(404).json({ message: 'Lab record not found' });

    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Delete a lab record
// @route DELETE /api/labs/:id
// @access Private
export const deleteLab = async (req, res) => {
  try {
    const record = await LabRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Lab record not found' });

    res.status(200).json({ message: 'Lab record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
