import mongoose from 'mongoose';

const abroadCountrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    trim: true,
    uppercase: true,
    default: ''  // ISO 3166-1 alpha-2, drives the flag; empty for custom entries
  },
  cover: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }  // kept so a replaced/removed cover is deleted from Cloudinary
  },
  overview: {
    type: String,
    default: ''  // markdown
  },
  status: {
    type: String,
    enum: ['exploring', 'shortlisted', 'applying', 'dropped'],
    default: 'exploring'
  },
  pinned: {
    type: Boolean,
    default: false
  },
  // Free text on purpose: real answers look like "€0–3k/yr" or "IELTS 6.5 / TOEFL 90"
  facts: {
    tuition: { type: String, default: '', trim: true },
    livingCost: { type: String, default: '', trim: true },
    language: { type: String, default: '', trim: true },
    visa: { type: String, default: '', trim: true },
    workRights: { type: String, default: '', trim: true },
    currency: { type: String, default: '', trim: true },
    intakes: { type: String, default: '', trim: true }
  }
}, { timestamps: true });

abroadCountrySchema.index({ userId: 1, pinned: -1, createdAt: -1 });

export default mongoose.model('AbroadCountry', abroadCountrySchema);
