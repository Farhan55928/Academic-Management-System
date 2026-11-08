import mongoose from 'mongoose';
import { makeAbroadChildSchema } from './abroadChildSchema.js';

const abroadNoteSchema = makeAbroadChildSchema({
  title: { type: String, default: '', trim: true },
  tags: {
    type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
    default: []
  },
  format: {
    type: String,
    enum: ['markdown', 'text'],
    default: 'markdown'
  },
  content: {
    type: String,
    default: ''
  },
  pinned: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model('AbroadNote', abroadNoteSchema);
