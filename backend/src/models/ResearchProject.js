import mongoose from 'mongoose';

const researchProjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    color: {
      type: String,
      default: '#1e3a6e',
    },
    // Created lazily on first PDF upload to that project.
    // Cached so we don't search Drive on every subsequent upload.
    driveFolderId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// No two projects with the same name for a single user.
researchProjectSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model('ResearchProject', researchProjectSchema);
