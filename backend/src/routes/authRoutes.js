import express from 'express';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);

// ─── Google Drive OAuth (Research Logs) ───────────────────────────
// Scopes are intentionally restrictive: drive.file only lets us act on
// files this app creates, so we can't read or delete anything else in the
// user's Drive. OpenID gives us the user's basic profile for the consent
// screen, but we don't actually persist it.
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'openid',
  'email',
];

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function makeOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:9000/api/auth/google/callback'
  );
}

// Step 1: Redirect user to Google's consent screen. Requires the user to
// already be authenticated with our app — the client passes its JWT as
// the `token` query param (browsers don't send Authorization headers on
// plain navigations). We round-trip that as the OAuth `state` so the
// callback can recover the user identity.
router.get('/google', (req, res) => {
  const oauth2 = makeOAuth2Client();
  const token = req.query.token || '';
  const url = oauth2.generateAuthUrl({
    access_type: 'offline',         // request a refresh token
    prompt: 'consent',              // force a fresh refresh token every time
    scope: SCOPES,
    state: token,
  });
  res.redirect(url);
});

// Step 2: Google calls this back with a one-time code. We exchange it for
// tokens, persist them on the User doc, then redirect back to the frontend.
router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('Missing authorization code');

  // Decode the JWT we round-tripped in `state` to find the user.
  let userId;
  try {
    const decoded = jwt.verify(state, process.env.ACCESS_TOKEN_SECRET);
    userId = decoded.id;
  } catch {
    return res.redirect(`${FRONTEND_URL}/research?drive=invalid_state`);
  }

  const oauth2 = makeOAuth2Client();
  let tokens;
  try {
    ({ tokens } = await oauth2.getToken(code));
  } catch (err) {
    console.error('[google oauth] token exchange failed:', err?.message);
    return res.redirect(`${FRONTEND_URL}/research?drive=exchange_failed`);
  }

  if (!tokens.access_token) {
    return res.redirect(`${FRONTEND_URL}/research?drive=no_access_token`);
  }

  await User.findByIdAndUpdate(userId, {
    googleAccessToken: tokens.access_token,
    googleRefreshToken: tokens.refresh_token || undefined, // undefined → keep existing
    googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    googleConnectedAt: new Date(),
  });

  res.redirect(`${FRONTEND_URL}/research?drive=connected`);
});

export default router;
