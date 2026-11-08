import mongoose from 'mongoose';
import { makeAbroadChildSchema } from './abroadChildSchema.js';

const abroadChecklistItemSchema = makeAbroadChildSchema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  isDone: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date,
    default: null
  },
  note: {
    type: String,
    default: ''  // markdown
  },
  order: {
    type: Number,
    default: 0
  }
});

export default mongoose.model('AbroadChecklistItem', abroadChecklistItemSchema);
