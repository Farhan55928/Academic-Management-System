import { v2 as cloudinary } from 'cloudinary';

// Read lazily (not at import time): app.js calls dotenv.config() after its
// imports are evaluated, so process.env isn't populated yet at module load.
export const cloudinaryConfig = () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
});

export const isCloudinaryConfigured = () => {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  return Boolean(cloudName && apiKey && apiSecret);
};

export const getCloudinary = () => {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return cloudinary;
};

// Every user's uploads live under their own folder, which is also how
// deletes are authorised (a user may only destroy public_ids under it).
export const userFolder = (userId) => `ams/${userId}`;
