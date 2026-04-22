import mongoose from 'mongoose';

const dayOverviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studyDayId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyDay',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  reflection: {
    type: String,
    trim: true,
    default: ''
  },
  improveZone: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

// Only one overview per study day
dayOverviewSchema.index({ studyDayId: 1 }, { unique: true });

export default mongoose.model('DayOverview', dayOverviewSchema);
