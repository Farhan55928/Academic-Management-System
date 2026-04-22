import mongoose from 'mongoose';

const hourBlockSchema = new mongoose.Schema({
  blockIndex: {
    type: Number,
    required: true  // 0-based offset from session start
  },
  topic: {
    type: String,
    trim: true,
    default: ''
  },
  wasted: {
    type: Boolean,
    default: false
  },
  note: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: false });

const studySessionSchema = new mongoose.Schema({
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
  startTime: {
    type: String,
    required: true  // "HH:MM" 24-hour format
  },
  endTime: {
    type: String,
    required: true  // "HH:MM" 24-hour format
  },
  durationHours: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  hourBlocks: {
    type: [hourBlockSchema],
    default: []
  }
}, { timestamps: true });

export default mongoose.model('StudySession', studySessionSchema);
