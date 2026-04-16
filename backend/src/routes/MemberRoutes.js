import express from 'express';
import { HttpRequest } from '../utils/HttpRequest.js';
import Member from '../models/Member.js';

const router = express.Router();

// a) Add a new member — only if age > 18
router.post('/add', async (req, res) => {
  const { name, age, membershipType, weight } = req.body;

  if (!name || age === undefined || !membershipType || weight === undefined) {
    return HttpRequest(res, 400, true, 'All fields (name, age, membershipType, weight) are required');
  }

  if (age <= 18) {
    return HttpRequest(
      res,
      400,
      true,
      'Member is too young to join. We suggest signing up for our "Yoga for Toddlers" program instead!'
    );
  }

  try {
    const newMember = new Member({ name, age, membershipType, weight });
    await newMember.save();
    return HttpRequest(res, 201, false, 'Member added successfully', { member: newMember });
  } catch (error) {
    return HttpRequest(res, 500, true, 'Internal Server Error');
  }
});

// b) Get all members sorted by age (youngest to oldest)
router.get('/sorted-by-age', async (req, res) => {
  try {
    const members = await Member.find().sort({ age: 1 });
    return HttpRequest(res, 200, false, 'Members fetched and sorted by age', { members });
  } catch (error) {
    return HttpRequest(res, 500, true, 'Internal Server Error');
  }
});

// c) Get a specific member by ID
router.get('/:id', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return HttpRequest(res, 404, true, 'Member not found');
    return HttpRequest(res, 200, false, 'Member fetched successfully', { member });
  } catch (error) {
    return HttpRequest(res, 500, true, 'Internal Server Error');
  }
});

// d) Get members with Yearly membership and weight over 80kg
router.get('/campaign/yearly-heavy', async (req, res) => {
  try {
    const members = await Member.find({ membershipType: 'Yearly', weight: { $gt: 80 } });
    return HttpRequest(res, 200, false, 'Targeted campaign members fetched', { members });
  } catch (error) {
    return HttpRequest(res, 500, true, 'Internal Server Error');
  }
});

// e) Partially update a member's information (only modified fields)
router.patch('/update/:id', async (req, res) => {
  try {
    const updatedMember = await Member.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedMember) return HttpRequest(res, 404, true, 'Member not found');
    return HttpRequest(res, 200, false, 'Member updated successfully', { member: updatedMember });
  } catch (error) {
    return HttpRequest(res, 500, true, 'Internal Server Error');
  }
});

export default router;
