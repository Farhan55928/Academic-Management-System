import mongoose from 'mongoose';

const marksRecordSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    type: {
      type: String,
      enum: ['quiz', 'mid', 'assignment'],
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
    obtainedMarks: {
      type: Number,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    remark: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const MarksRecord = mongoose.model('MarksRecord', marksRecordSchema);
export default MarksRecord;
