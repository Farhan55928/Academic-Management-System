import { useRef, useState } from 'react';
import { MdAddPhotoAlternate, MdClose } from 'react-icons/md';
import toast from 'react-hot-toast';
import { uploadImage } from '../../api/uploads.js';
import { errorMessage } from '../../api/errors.js';

/**
 * Image picker that uploads to Cloudinary on selection.
 * `value` / `onChange` carry `{ url, publicId }` (or null when cleared).
 * `onBusyChange` lets the parent disable its Save button mid-upload.
 */
export default function ImageUpload({ value, onChange, onBusyChange, label = 'Cover image' }) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);

  const pick = async (file) => {
    if (!file) return;
    setProgress(0);
    onBusyChange?.(true);
    try {
      const img = await uploadImage(file, { onProgress: setProgress });
      onChange({ url: img.url, publicId: img.publicId });
    } catch (err) {
      toast.error(err.response ? errorMessage(err, 'Upload failed') : err.message);
    } finally {
      setProgress(null);
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const uploading = progress !== null;

  return (
    <div className="image-upload">
      <button
        type="button"
        className={`image-upload-drop ${value?.url ? 'has-image' : ''}`}
        style={value?.url ? { backgroundImage: `url("${value.url}")` } : undefined}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label={value?.url ? `Change ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}
      >
        {uploading ? (
          <span className="image-upload-progress">
            <span className="image-upload-bar"><span style={{ width: `${progress}%` }} /></span>
            Uploading… {progress}%
          </span>
        ) : (
          <span className="image-upload-cta">
            <MdAddPhotoAlternate size={22} />
            {value?.url ? 'Change image' : `Add ${label.toLowerCase()}`}
          </span>
        )}
      </button>

      {value?.url && !uploading && (
        <button type="button" className="image-upload-remove" onClick={() => onChange(null)} aria-label="Remove image">
          <MdClose size={16} />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}
