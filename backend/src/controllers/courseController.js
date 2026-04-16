import Course from '../models/Course.js';

// @desc  Get all courses for a semester
// @route GET /api/semesters/:semesterId/courses
// @access Private
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ semester: req.params.semesterId }).sort({ createdAt: 1 });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Create a course in a semester
// @route POST /api/semesters/:semesterId/courses
// @access Private
export const createCourse = async (req, res) => {
  try {
    const { name, code, type, creditHours } = req.body;

    if (!name || !code || !type) {
      return res.status(400).json({ message: 'Name, code, and type are required' });
    }

    if (!['theory', 'lab'].includes(type)) {
      return res.status(400).json({ message: 'Type must be theory or lab' });
    }

    const course = await Course.create({
      semester: req.params.semesterId,
      name,
      code,
      type,
      creditHours: creditHours || 3,
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Update a course
// @route PUT /api/courses/:id
// @access Private
export const updateCourse = async (req, res) => {
  try {
    const { name, code, type, creditHours } = req.body;
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { name, code, type, creditHours },
      { new: true, runValidators: true }
    );

    if (!course) return res.status(404).json({ message: 'Course not found' });

    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Delete a course
// @route DELETE /api/courses/:id
// @access Private
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    res.status(200).json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
