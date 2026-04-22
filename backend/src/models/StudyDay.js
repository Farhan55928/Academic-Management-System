import mongoose from 'mongoose';

const studyDaySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  }
}, { timestamps: true });

// One study day entry per user per date
studyDaySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('StudyDay', studyDaySchema);
