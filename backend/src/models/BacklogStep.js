import mongoose from 'mongoose';

const backlogStepSchema = new mongoose.Schema({
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
  subsectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BacklogSubsection',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  isDone: {
    type: Boolean,
    default: false  // the source of truth every other level rolls up from
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

backlogStepSchema.index({ weekId: 1 });
backlogStepSchema.index({ subsectionId: 1, order: 1 });

export default mongoose.model('BacklogStep', backlogStepSchema);
