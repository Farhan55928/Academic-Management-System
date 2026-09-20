import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ code: 'NO_TOKEN', message: 'Not authorized, no token provided' });
  }

  // Token validity is a purely local check (signature + expiry) — it can
  // never fail because of the network or the database, so it always means
  // the token itself is bad.
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    const code = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID';
    return res.status(401).json({ code, message: 'Not authorized, token invalid' });
  }

  // The user lookup is a database call and CAN fail from a slow/unreachable
  // DB — that must never be reported as an auth failure, or a valid token
  // looks "invalid" whenever the connection is flaky.
  try {
    req.user = await User.findById(decoded.id).select('_id email').lean();

    if (!req.user) {
      return res.status(401).json({ code: 'USER_NOT_FOUND', message: 'Not authorized, user not found' });
    }

    next();
  } catch (error) {
    console.error('[auth] user lookup failed:', error?.message);
    return res.status(503).json({
      code: 'DB_UNAVAILABLE',
      message: 'Service temporarily unavailable. Please try again.',
    });
  }
};
