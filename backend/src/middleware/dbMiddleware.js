import { connectDB } from '../config/db.js';

// Gates every route that touches the database. A failure here means the
// request is not the client's fault — always 503, never 401/500, so the
// frontend can tell "retry me" apart from "you're not authorized".
export const ensureDb = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[db] connection failed:', err?.message);
    res.status(503).json({
      code: 'DB_UNAVAILABLE',
      message: 'Service temporarily unavailable. Please try again.',
    });
  }
};
