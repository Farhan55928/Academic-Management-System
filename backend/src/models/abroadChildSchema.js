import mongoose from 'mongoose';

// Every Abroad Log child (checklist item, program, contact, video, note) is
// owned by a user and a country. Both are denormalised onto each row so a
// country's whole log loads — and cascade-deletes — in flat queries.
export const makeAbroadChildSchema = (fields) => {
  const schema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    countryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AbroadCountry',
      required: true
    },
    ...fields
  }, { timestamps: true });

  schema.index({ countryId: 1, createdAt: 1 });
  return schema;
};
