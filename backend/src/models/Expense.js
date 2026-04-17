import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  monthId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Month',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    default: 'Other'
  },
  remark: {
    type: String,
    trim: true
  }
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);
