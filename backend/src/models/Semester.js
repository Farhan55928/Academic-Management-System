import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent duplicate semester names for the same user in the same year
semesterSchema.index({ userId: 1, name: 1, year: 1 }, { unique: true });

const Semester = mongoose.model('Semester', semesterSchema);
export default Semester;
