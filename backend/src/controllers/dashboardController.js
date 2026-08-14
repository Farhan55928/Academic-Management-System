import Semester from '../models/Semester.js';
import Course from '../models/Course.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import LabRecord from '../models/LabRecord.js';
import MarksRecord from '../models/MarksRecord.js';

// @desc  Get all dashboard data for the active semester in one request
// @route GET /api/dashboard
// @access Private
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const semesters = await Semester.find({ userId }).sort({ year: -1, createdAt: -1 });

    const activeSemester = semesters.find((s) => s.isActive) || semesters[0] || null;

    if (!activeSemester) {
      return res.status(200).json({ semesters, activeSemester: null, courses: [], activity: [] });
    }

    const rawCourses = await Course.find({ semester: activeSemester._id, userId }).sort({ createdAt: 1 });

    const courseIds = rawCourses.map((c) => c._id);

    const [attendanceRecords, labRecords, marksRecords] = await Promise.all([
      AttendanceRecord.find({ course: { $in: courseIds } }),
      LabRecord.find({ course: { $in: courseIds } }),
      MarksRecord.find({ course: { $in: courseIds } }),
    ]);

    // Build a lookup map: courseId -> courseName for activity tagging
    const courseNameMap = {};
    for (const c of rawCourses) {
      courseNameMap[c._id.toString()] = c.name;
    }

    // Compute per-course attendance stats
    const attendanceMap = {};
    for (const record of attendanceRecords) {
      const id = record.course.toString();
      if (!attendanceMap[id]) attendanceMap[id] = { total: 0, present: 0 };
      attendanceMap[id].total += 1;
      if (record.status === 'present') attendanceMap[id].present += 1;
    }

    const courses = rawCourses.map((c) => {
      const a = attendanceMap[c._id.toString()] || { total: 0, present: 0 };
      const pct = a.total > 0 ? Math.round((a.present / a.total) * 100) : null;
      return { ...c.toObject(), stats: { total: a.total, present: a.present, pct } };
    });

    // Build activity feed (top 5 most recent across all types)
    const activity = [
      ...attendanceRecords.map((r) => ({
        ...r.toObject(),
        actType: 'Attendance',
        courseName: courseNameMap[r.course.toString()] || '',
      })),
      ...labRecords.map((r) => ({
        ...r.toObject(),
        actType: 'Lab',
        courseName: courseNameMap[r.course.toString()] || '',
      })),
      ...marksRecords.map((r) => ({
        ...r.toObject(),
        actType: 'Marks',
        courseName: courseNameMap[r.course.toString()] || '',
      })),
    ]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);

    res.status(200).json({ semesters, activeSemester, courses, activity });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
