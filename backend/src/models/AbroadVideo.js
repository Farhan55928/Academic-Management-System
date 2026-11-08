import mongoose from 'mongoose';
import { makeAbroadChildSchema } from './abroadChildSchema.js';

const abroadVideoSchema = makeAbroadChildSchema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  platform: {
    type: String,
    enum: ['facebook', 'youtube'],
    required: true  // set by the controller from the URL, never trusted from the client
  },
  title: { type: String, default: '', trim: true },
  note: {
    type: String,
    default: ''  // markdown
  },
  order: {
    type: Number,
    default: 0
  }
});

export default mongoose.model('AbroadVideo', abroadVideoSchema);
