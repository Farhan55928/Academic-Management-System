import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    membershipType: { type: String, required: true },
    weight: { type: Number, required: true },
  },
  { timestamps: true }
);

const Member = mongoose.model('Member', MemberSchema, 'members');
export default Member;
