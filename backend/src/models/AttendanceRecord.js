import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent'],
      required: true,
    },
    remark: {
      type: String,
      default: '',
    },
    // Only meaningful when status === 'absent'
    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
export default AttendanceRecord;
