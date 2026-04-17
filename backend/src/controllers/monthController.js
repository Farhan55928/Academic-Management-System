import Month from '../models/Month.js';
import Expense from '../models/Expense.js';

// @desc    Get all months for the user
// @route   GET /api/months
export const getMonths = async (req, res) => {
  try {
    const months = await Month.find({ userId: req.user._id }).sort({ year: -1, name: -1 });
    res.json(months);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single month with its expenses
// @route   GET /api/months/:id
export const getMonthDetails = async (req, res) => {
  try {
    const month = await Month.findById(req.params.id);
    if (!month || month.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Month not found' });
    }
    
    // Fetch expenses linked to this month
    const expenses = await Expense.find({ monthId: month._id }).sort({ date: -1 });
    res.json({ ...month._doc, expenses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new month
// @route   POST /api/months
export const createMonth = async (req, res) => {
  const { name, year, budget } = req.body;
  try {
    const month = await Month.create({
      userId: req.user._id,
      name,
      year,
      budget
    });
    res.status(201).json(month);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This month already exists for the given year' });
    }
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update month (e.g. budget)
export const updateMonth = async (req, res) => {
  try {
    const month = await Month.findById(req.params.id);
    if (!month || month.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Month not found' });
    }
    const updated = await Month.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a month and all its expenses
export const deleteMonth = async (req, res) => {
  try {
    const month = await Month.findById(req.params.id);
    if (!month || month.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Month not found' });
    }
    
    // Delete all linked expenses
    await Expense.deleteMany({ monthId: month._id });
    await month.deleteOne();
    
    res.json({ message: 'Month and its associated expenses removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
