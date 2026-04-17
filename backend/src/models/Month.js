import mongoose from 'mongoose';

const monthSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  },
  year: {
    type: Number,
    required: true
  },
  budget: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Ensure a user can't have duplicate months for the same year
monthSchema.index({ userId: 1, name: 1, year: 1 }, { unique: true });

export default mongoose.model('Month', monthSchema);
