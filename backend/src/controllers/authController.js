import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper: generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '30d',
  });
};

// @desc  Login user
// @route POST /api/auth/login
// @access Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ code: 'MISSING_FIELDS', message: 'Please provide email and password' });
  }

  // Isolated from the credential check below: a DB timeout here is an
  // infrastructure problem, not a wrong password, and must never be
  // reported as one.
  let user;
  try {
    user = await User.findOne({ email: email.toLowerCase() });
  } catch (error) {
    console.error('[login] db lookup failed:', error?.message);
    return res.status(503).json({
      code: 'DB_UNAVAILABLE',
      message: 'Service temporarily unavailable. Please try again.',
    });
  }

  try {
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    res.status(200).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Server error during login' });
  }
};

// @desc  Get current logged-in user
// @route GET /api/auth/me
// @access Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('_id email').lean();
    res.status(200).json({
      id: user._id,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Server error' });
  }
};
