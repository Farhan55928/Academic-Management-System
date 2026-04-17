import Expense from '../models/Expense.js';

// @desc    Get expenses for a specific month
// @route   GET /api/expenses?monthId=...
export const getExpenses = async (req, res) => {
  const { monthId } = req.query;
  try {
    const filter = { userId: req.user._id };
    if (monthId) filter.monthId = monthId;

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new expense to a month
// @route   POST /api/expenses
export const addExpense = async (req, res) => {
  const { monthId, date, title, amount, category, remark } = req.body;
  
  if (!monthId) {
    return res.status(400).json({ message: 'monthId is required' });
  }

  try {
    const expense = await Expense.create({
      userId: req.user._id,
      monthId,
      date,
      title,
      amount,
      category,
      remark
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    if (expense.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    if (expense.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
