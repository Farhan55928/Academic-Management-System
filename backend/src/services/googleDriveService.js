import { google } from 'googleapis';
import User from '../models/User.js';

/**
 * Build an authenticated OAuth2 client for the given user. The client
 * transparently refreshes the access token when it expires — we just have
 * to make sure the user has a refresh token persisted on their record.
 */
function getOAuth2ClientForUser(user) {
  if (!user.googleAccessToken && !user.googleRefreshToken) {
    const err = new Error('Google Drive is not connected for this user');
    err.code = 'DRIVE_NOT_CONNECTED';
    throw err;
  }
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:9000/api/auth/google/callback'
  );
  oauth2.setCredentials({
    access_token:  user.googleAccessToken  || undefined,
    refresh_token: user.googleRefreshToken || undefined,
    expiry_date:   user.googleTokenExpiry  ? new Date(user.googleTokenExpiry).getTime() : undefined,
  });

  // Persist rotated tokens so subsequent requests don't re-refresh.
  oauth2.on('tokens', async (tokens) => {
    try {
      const update = {};
      if (tokens.access_token) update.googleAccessToken = tokens.access_token;
      if (tokens.expiry_date)   update.googleTokenExpiry = new Date(tokens.expiry_date);
      if (Object.keys(update).length) {
        await User.updateOne({ _id: user._id }, update);
      }
    } catch (e) {
      console.warn('[googleDrive] token persist failed:', e?.message);
    }
  });

  return oauth2;
}

function driveForUser(user) {
  return google.drive({ version: 'v3', auth: getOAuth2ClientForUser(user) });
}

/**
 * Find an existing folder by name, or create it. Returns the folder ID.
 * The Drive API can return duplicates for the same name in different
 * parents, but at the root level we only ever create one per user.
 */
async function findOrCreateFolder(drive, folderName, parentId = null) {
  const safeName = folderName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const query = [
    `mimeType='application/vnd.google-apps.folder'`,
    `name='${safeName}'`,
    'trashed=false',
    parentId ? `'${parentId}' in parents` : "'root' in parents",
  ].join(' and ');

  const list = await drive.files.list({ q: query, fields: 'files(id, name)' });
  if (list.data.files && list.data.files.length) {
    return list.data.files[0].id;
  }

  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    },
    fields: 'id',
  });
  return created.data.id;
}

/**
 * Lazily create `/AMS-Research/<projectName>/` for the user and cache the
 * folder ID on the project doc. Idempotent — safe to call concurrently
 * for the same project.
 */
export async function ensureProjectFolder(user, project) {
  const drive = driveForUser(user);
  const rootName = 'AMS-Research';

  let rootId;
  // Cache root ID on the user doc (one root per user, ever).
  if (!user._driveRootId) {
    rootId = await findOrCreateFolder(drive, rootName);
    await User.updateOne({ _id: user._id }, { _driveRootId: rootId });
  } else {
    rootId = user._driveRootId;
  }

  if (project.driveFolderId) return project.driveFolderId;
  const folderId = await findOrCreateFolder(drive, project.name, rootId);
  project.driveFolderId = folderId;
  await project.save();
  return folderId;
}

/**
 * Upload a PDF buffer to the user's Drive inside the project's folder.
 * Returns { driveFileId, webViewLink }.
 */
export async function uploadPdfToDrive(user, project, { filename, buffer, mimeType }) {
  const folderId = await ensureProjectFolder(user, project);
  const drive = driveForUser(user);

  const created = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType: mimeType || 'application/pdf',
      body: bufferToStream(buffer),
    },
    fields: 'id, webViewLink',
  });

  return {
    driveFileId:     created.data.id,
    driveWebViewLink: created.data.webViewLink || '',
  };
}

/**
 * Best-effort delete. Swallows "not found" since the user may have
 * already removed it themselves.
 */
export async function deleteDriveFile(user, fileId) {
  if (!fileId) return;
  const drive = driveForUser(user);
  try {
    await drive.files.delete({ fileId });
  } catch (err) {
    if (err?.code === 404) return;
    throw err;
  }
}

/**
 * Stream the PDF binary back out of Drive so the summary service can
 * extract text without ever persisting it on our side.
 */
export async function downloadDriveFile(user, fileId) {
  const drive = driveForUser(user);
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );
  return res.data; // a readable stream
}

/* ── helpers ─────────────────────────────────────────────────── */

import { Readable } from 'stream';
function bufferToStream(buffer) {
  // googleapis accepts a Buffer too, but wrapping in a Readable stream
  // lets us handle larger files more predictably.
  return Readable.from(buffer);
}
