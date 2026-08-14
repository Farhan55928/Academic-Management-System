import mongoose from 'mongoose';

const backlogSubsectionSchema = new mongoose.Schema({
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
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BacklogSection',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['none', 'low', 'medium', 'high'],
    default: 'none'
  },
  isDone: {
    type: Boolean,
    default: false  // rolled up from its steps, or set by hand when it has none
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

backlogSubsectionSchema.index({ weekId: 1 });
backlogSubsectionSchema.index({ sectionId: 1, order: 1 });

export default mongoose.model('BacklogSubsection', backlogSubsectionSchema);
