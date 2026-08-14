/**
 * One-time migration script.
 * Assigns all existing Semester and Course documents (that have no userId)
 * to the user with email: farhankhan@iut-dhaka.edu
 *
 * Usage:  node --experimental-modules src/scripts/migrateOwnership.js
 *   (or)  node src/scripts/migrateOwnership.js
 *
 * Make sure your .env file is in the backend/ root with Mongo_URI set.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env from backend root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

import User from '../models/User.js';
import Semester from '../models/Semester.js';
import Course from '../models/Course.js';

const TARGET_EMAIL = 'farhankhan@iut-dhaka.edu';

async function migrate() {
  try {
    await mongoose.connect(process.env.Mongo_URI);
    console.log('Connected to MongoDB ✅');

    // 1. Find the target user
    const user = await User.findOne({ email: TARGET_EMAIL });
    if (!user) {
      console.error(`❌ User with email "${TARGET_EMAIL}" not found. Aborting.`);
      process.exit(1);
    }
    console.log(`Found user: ${user.name || user.email} (${user._id})`);

    // 2. Assign all semesters without a userId to this user
    const semResult = await Semester.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: user._id } }
    );
    console.log(`✅ Updated ${semResult.modifiedCount} semester(s)`);

    // Also handle semesters where userId is null
    const semNullResult = await Semester.updateMany(
      { userId: null },
      { $set: { userId: user._id } }
    );
    console.log(`✅ Updated ${semNullResult.modifiedCount} semester(s) with null userId`);

    // 3. Assign all courses without a userId to this user
    const courseResult = await Course.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: user._id } }
    );
    console.log(`✅ Updated ${courseResult.modifiedCount} course(s)`);

    const courseNullResult = await Course.updateMany(
      { userId: null },
      { $set: { userId: user._id } }
    );
    console.log(`✅ Updated ${courseNullResult.modifiedCount} course(s) with null userId`);

    console.log('\n🎉 Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
