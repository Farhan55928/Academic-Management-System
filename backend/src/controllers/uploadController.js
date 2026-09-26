import { getCloudinary, cloudinaryConfig, isCloudinaryConfigured, userFolder } from '../config/cloudinary.js';

const notConfigured = (res) =>
  res.status(503).json({
    code: 'UPLOADS_NOT_CONFIGURED',
    message: 'Image uploads are not configured on the server.',
  });

// Issues a short-lived signature so the browser can upload straight to
// Cloudinary. Files never pass through this server, which keeps large phone
// photos clear of Vercel's ~4.5 MB request-body limit, and the API secret
// never leaves the backend.
export const getUploadSignature = async (req, res) => {
  if (!isCloudinaryConfigured()) return notConfigured(res);

  try {
    const cloudinary = getCloudinary();
    const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
    const timestamp = Math.round(Date.now() / 1000);
    const folder = userFolder(req.user._id);

    // Only params included here are enforced by the signature; the client
    // must send exactly these alongside the file.
    const paramsToSign = { timestamp, folder };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    res.json({ cloudName, apiKey, timestamp, folder, signature });
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR', message: error.message });
  }
};

export const deleteImage = async (req, res) => {
  if (!isCloudinaryConfigured()) return notConfigured(res);

  const { publicId } = req.body ?? {};
  if (!publicId || typeof publicId !== 'string') {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'publicId is required' });
  }
  if (!publicId.startsWith(`${userFolder(req.user._id)}/`)) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Not allowed to delete this image' });
  }

  try {
    const result = await getCloudinary().uploader.destroy(publicId, { invalidate: true });
    res.json({ result: result.result });
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR', message: error.message });
  }
};
