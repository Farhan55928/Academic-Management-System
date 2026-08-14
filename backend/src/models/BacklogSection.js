import mongoose from 'mongoose';

const backlogSectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weekId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BacklogWeek',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null  // optional link; title still stands on its own if the course is deleted
  },
  isDone: {
    type: Boolean,
    default: false  // rolled up from its subsections
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

backlogSectionSchema.index({ weekId: 1, order: 1 });

export default mongoose.model('BacklogSection', backlogSectionSchema);
