import { useState, useRef } from 'react';
import { MdClose, MdCloudUpload, MdPictureAsPdf } from 'react-icons/md';
import { uploadPaper } from '../../api/research.js';

/**
 * Upload modal for a single PDF. Drag-and-drop or click to browse.
 * Streams straight to the backend, which then ships to Drive + kicks
 * off the Gemini summary.
 */
export default function UploadPaperModal({ projectId, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = (f) => {
    setError('');
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are supported');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File must be under 20 MB');
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.pdf$/i, ''));
  };

  const handleSubmit = async () => {
    if (!file) return setError('Pick a PDF first');
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      if (title.trim()) fd.append('title', title.trim());
      const res = await uploadPaper(projectId, fd);
      onUploaded(res.data);
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === 'DRIVE_NOT_CONNECTED') {
        setError('Connect your Google Drive on the Research Logs page before uploading.');
      } else {
        setError(err?.response?.data?.message || 'Upload failed');
      }
      setUploading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(10, 18, 36, 0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: 'linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
        backdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: 32, width: '100%', maxWidth: 520,
        boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '28px 32px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(96,165,250,0.8)', marginBottom: 4 }}>
              Add Paper
            </p>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>
              Upload Research Paper
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <MdClose size={20} />
          </button>
        </div>

        <div style={{ padding: '24px 32px 28px' }}>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            style={{
              border: `2px dashed ${dragging ? '#93c5fd' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 20,
              padding: '36px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)',
              marginBottom: 20,
              transition: 'all 0.2s',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <MdPictureAsPdf size={28} color="#93c5fd" />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 14 }}>{file.name}</p>
                  <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ) : (
              <>
                <MdCloudUpload size={36} color="rgba(255,255,255,0.3)" />
                <p style={{ margin: '12px 0 4px', color: '#fff', fontWeight: 700 }}>Drop PDF here or click to browse</p>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Max 20 MB · Will be saved to your Google Drive</p>
              </>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
              Title (optional — defaults to filename)
            </label>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, overflow: 'hidden' }}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Paper title"
                style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', padding: '14px 18px', color: '#fff', fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, color: '#fca5a5', fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button onClick={onClose} disabled={uploading} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '11px 22px', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={uploading || !file} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', padding: '11px 26px', borderRadius: 14, fontSize: 14, fontWeight: 700, border: 'none', cursor: uploading ? 'wait' : 'pointer', boxShadow: '0 8px 20px rgba(99,102,241,0.4)', opacity: uploading || !file ? 0.6 : 1 }}>
              {uploading ? 'Uploading…' : 'Upload & Summarize'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
