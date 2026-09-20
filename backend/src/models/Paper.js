import mongoose from 'mongoose';

const paperSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    researchProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResearchProject',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    // The PDF lives in the user's personal Google Drive.
    // We only ever store metadata here — never the PDF binary.
    driveFileId: { type: String, required: true },
    driveWebViewLink: { type: String, default: '' },
    fileSizeBytes: { type: Number, default: 0 },

    // AI-generated summary lifecycle
    summaryStatus: {
      type: String,
      enum: ['pending', 'generating', 'ready', 'failed'],
      default: 'pending',
      index: true,
    },
    summaryMarkdown: { type: String, default: '' },
    summaryError:    { type: String, default: '' },
    summaryGeneratedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Fast lookup for the project's paper list, newest first.
paperSchema.index({ userId: 1, researchProjectId: 1, createdAt: -1 });

export default mongoose.model('Paper', paperSchema);
