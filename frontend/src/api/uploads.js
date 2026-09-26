import axios from 'axios';
import api from './axios.js';

const MAX_BYTES = 10 * 1024 * 1024; // Cloudinary free-plan image limit

export const getUploadSignature = () => api.post('/uploads/signature');
export const deleteImage = (publicId) => api.delete('/uploads', { data: { publicId } });

/**
 * Uploads an image straight to Cloudinary using a server-issued signature.
 * The file never passes through our backend (Vercel caps request bodies at ~4.5 MB).
 *
 * Resolves to { url, publicId, width, height } — store `url` to display the
 * image and `publicId` so it can be deleted later.
 */
export async function uploadImage(file, { onProgress } = {}) {
  if (!file?.type?.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > MAX_BYTES) throw new Error('Image is larger than 10 MB.');

  const { data: sig } = await getUploadSignature();

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', sig.timestamp);
  form.append('folder', sig.folder);
  form.append('signature', sig.signature);

  // Plain axios, not the `api` instance: this request goes to Cloudinary and
  // must not carry our baseURL or the ams_token bearer header.
  const { data } = await axios.post(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    form,
    {
      onUploadProgress: onProgress
        ? (e) => e.total && onProgress(Math.round((e.loaded / e.total) * 100))
        : undefined,
    },
  );

  return { url: data.secure_url, publicId: data.public_id, width: data.width, height: data.height };
}
