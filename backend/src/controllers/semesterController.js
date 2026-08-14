import Semester from '../models/Semester.js';

// @desc  Get all semesters for the logged-in user
// @route GET /api/semesters
// @access Private
export const getSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find({ userId: req.user._id }).sort({ year: -1, createdAt: -1 });
    res.status(200).json(semesters);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Create a semester
// @route POST /api/semesters
// @access Private
export const createSemester = async (req, res) => {
  try {
    const { name, year, isActive } = req.body;

    if (!name || !year) {
      return res.status(400).json({ message: 'Name and year are required' });
    }

    const semester = await Semester.create({
      userId: req.user._id,
      name,
      year,
      isActive: isActive || false,
    });
    res.status(201).json(semester);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This semester already exists for the given year' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Update a semester
// @route PUT /api/semesters/:id
// @access Private
export const updateSemester = async (req, res) => {
  try {
    const { name, year, isActive } = req.body;
    const semester = await Semester.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, year, isActive },
      { new: true, runValidators: true }
    );

    if (!semester) return res.status(404).json({ message: 'Semester not found' });

    res.status(200).json(semester);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Delete a semester
// @route DELETE /api/semesters/:id
// @access Private
export const deleteSemester = async (req, res) => {
  try {
    const semester = await Semester.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!semester) return res.status(404).json({ message: 'Semester not found' });

    res.status(200).json({ message: 'Semester deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Set a semester as active (deactivates all others for this user only)
// @route PATCH /api/semesters/:id/activate
// @access Private
export const activateSemester = async (req, res) => {
  try {
    // Only deactivate the current user's semesters, not everyone's
    await Semester.updateMany({ userId: req.user._id }, { isActive: false });
    const semester = await Semester.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isActive: true },
      { new: true }
    );

    if (!semester) return res.status(404).json({ message: 'Semester not found' });

    res.status(200).json(semester);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
