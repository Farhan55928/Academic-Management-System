import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['theory', 'lab'],
      required: true,
    },
    creditHours: {
      type: Number,
      default: 3,
    },
  },
  { timestamps: true }
);

courseSchema.index({ userId: 1, semester: 1 });

const Course = mongoose.model('Course', courseSchema);
export default Course;
