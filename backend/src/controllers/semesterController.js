import Semester from '../models/Semester.js';

// @desc  Get all semesters
// @route GET /api/semesters
// @access Private
export const getSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find().sort({ year: -1, createdAt: -1 });
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

    const semester = await Semester.create({ name, year, isActive: isActive || false });
    res.status(201).json(semester);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Update a semester
// @route PUT /api/semesters/:id
// @access Private
export const updateSemester = async (req, res) => {
  try {
    const { name, year, isActive } = req.body;
    const semester = await Semester.findByIdAndUpdate(
      req.params.id,
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
    const semester = await Semester.findByIdAndDelete(req.params.id);
    if (!semester) return res.status(404).json({ message: 'Semester not found' });

    res.status(200).json({ message: 'Semester deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Set a semester as active (deactivates all others)
// @route PATCH /api/semesters/:id/activate
// @access Private
export const activateSemester = async (req, res) => {
  try {
    await Semester.updateMany({}, { isActive: false });
    const semester = await Semester.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!semester) return res.status(404).json({ message: 'Semester not found' });

    res.status(200).json(semester);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
