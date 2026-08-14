import mongoose from 'mongoose';

const backlogWeekSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  weekNumber: {
    type: Number,
    required: true,
    min: 1
  },
  isDone: {
    type: Boolean,
    default: false  // rolled up from its sections
  }
}, { timestamps: true });

// One "Week 5" per semester per user
backlogWeekSchema.index({ userId: 1, semester: 1, weekNumber: 1 }, { unique: true });

export default mongoose.model('BacklogWeek', backlogWeekSchema);
