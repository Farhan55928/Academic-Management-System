import AttendanceRecord from '../models/AttendanceRecord.js';

// @desc  Get all attendance records for a course
// @route GET /api/courses/:courseId/attendance
// @access Private
export const getAttendance = async (req, res) => {
  try {
    const records = await AttendanceRecord.find({ course: req.params.courseId }).sort({ date: 1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Add an attendance record
// @route POST /api/courses/:courseId/attendance
// @access Private
export const addAttendance = async (req, res) => {
  try {
    const { date, status, remark, emailSent } = req.body;

    if (!date || !status) {
      return res.status(400).json({ message: 'Date and status are required' });
    }

    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({ message: 'Status must be present or absent' });
    }

    const record = await AttendanceRecord.create({
      course: req.params.courseId,
      date,
      status,
      remark: remark || '',
      emailSent: emailSent || false,
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Update an attendance record
// @route PUT /api/attendance/:id
// @access Private
export const updateAttendance = async (req, res) => {
  try {
    const { date, status, remark, emailSent } = req.body;

    const record = await AttendanceRecord.findByIdAndUpdate(
      req.params.id,
      { date, status, remark, emailSent },
      { new: true, runValidators: true }
    );

    if (!record) return res.status(404).json({ message: 'Attendance record not found' });

    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Delete an attendance record
// @route DELETE /api/attendance/:id
// @access Private
export const deleteAttendance = async (req, res) => {
  try {
    const record = await AttendanceRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Attendance record not found' });

    res.status(200).json({ message: 'Attendance record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
