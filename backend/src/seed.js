import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const seed = async () => {
  try {
    await mongoose.connect(process.env.Mongo_URI);
    console.log('Connected to MongoDB ✅');

    const email = 'farhankhan@iut-dhaka.edu';
    const password = '220041229';

    const existing = await User.findOne({ email });

    if (existing) {
      console.log(`User already exists: ${email}`);
    } else {
      await User.create({ email, password });
      console.log(`✅ User seeded: ${email}`);
    }

    await mongoose.disconnect();
    console.log('Disconnected. Seed complete.');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
