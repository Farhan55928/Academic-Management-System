import mongoose from 'mongoose';

const labRecordSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    labNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
    },
    // Lab Task tracking
    taskStatus: {
      type: String,
      enum: ['pending', 'completed', 'not_required'],
      default: 'pending',
    },
    taskRemark: {
      type: String,
      default: '',
    },
    // Lab Report tracking
    reportStatus: {
      type: String,
      enum: ['pending', 'submitted', 'graded', 'not_required'],
      default: 'pending',
    },
    reportRemark: {
      type: String,
      default: '',
    },
    reportMarks: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

const LabRecord = mongoose.model('LabRecord', labRecordSchema);
export default LabRecord;
