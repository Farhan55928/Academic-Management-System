import mongoose from 'mongoose';
import { makeAbroadChildSchema } from './abroadChildSchema.js';

const abroadProgramSchema = makeAbroadChildSchema({
  university: {
    type: String,
    required: true,
    trim: true
  },
  program: {
    type: String,
    default: '',
    trim: true
  },
  degree: {
    type: String,
    enum: ['MS', 'PhD', 'Other'],
    default: 'MS'
  },
  deadline: {
    type: Date,
    default: null
  },
  tuition: { type: String, default: '', trim: true },
  funding: { type: String, default: '', trim: true },
  link: { type: String, default: '', trim: true },
  status: {
    type: String,
    enum: ['researching', 'preparing', 'applied', 'interview', 'accepted', 'rejected'],
    default: 'researching'
  },
  notes: {
    type: String,
    default: ''  // markdown
  }
});

export default mongoose.model('AbroadProgram', abroadProgramSchema);
