import mongoose from 'mongoose';

// A reusable week skeleton. Stored as one embedded document — templates are small,
// always read whole, and never ticked, so they don't need the flat four-model layout.
const templateSubsectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  priority: { type: String, enum: ['none', 'low', 'medium', 'high'], default: 'none' },
  steps: [{ type: String, trim: true }]
}, { _id: false });

const templateSectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  subsections: [templateSubsectionSchema]
}, { _id: false });

const backlogTemplateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  sections: [templateSectionSchema]
}, { timestamps: true });

backlogTemplateSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model('BacklogTemplate', backlogTemplateSchema);
