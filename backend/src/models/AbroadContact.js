import mongoose from 'mongoose';
import { makeAbroadChildSchema } from './abroadChildSchema.js';

// A professor / potential supervisor, tracked through the cold-email funnel
const abroadContactSchema = makeAbroadChildSchema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  university: { type: String, default: '', trim: true },
  researchArea: { type: String, default: '', trim: true },
  email: { type: String, default: '', trim: true, lowercase: true },
  profileUrl: { type: String, default: '', trim: true },
  status: {
    type: String,
    enum: ['not_contacted', 'emailed', 'replied', 'interview', 'declined'],
    default: 'not_contacted'
  },
  lastContactedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''  // markdown
  }
});

export default mongoose.model('AbroadContact', abroadContactSchema);
