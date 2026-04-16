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
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
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
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc  Get current logged-in user
// @route GET /api/auth/me
// @access Private
export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      id: req.user._id,
      email: req.user.email,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
