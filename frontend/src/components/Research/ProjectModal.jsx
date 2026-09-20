import { useState } from 'react';
import { MdClose } from 'react-icons/md';

const COLORS = ['#1e3a6e', '#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

/**
 * Glass-style create/edit modal for a research project. Mirrors the
 * pattern in StudyDaysPage (inline styles, glass effect, dark color scheme).
 */
export default function ProjectModal({ project, onClose, onSave }) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [color, setColor] = useState(project?.color || COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = Boolean(project);

  const handleSave = async () => {
    if (!name.trim()) return setError('Project name is required');
    setSaving(true);
    setError('');
    try {
      await onSave({ name: name.trim(), description: description.trim(), color });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save project');
      setSaving(false);
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
        borderRadius: 32, width: '100%', maxWidth: 480,
        boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '28px 32px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(96,165,250,0.8)', marginBottom: 4 }}>
              {isEdit ? 'Edit Project' : 'New Project'}
            </p>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>
              {isEdit ? 'Update Research Project' : 'Create Research Project'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <MdClose size={20} />
          </button>
        </div>

        <div style={{ padding: '24px 32px 28px' }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
              Project Name *
            </label>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, overflow: 'hidden' }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. HCI, Autonomous Vehicles"
                style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', padding: '16px 20px', color: '#fff', fontSize: 16, fontWeight: 600, outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
              Description (optional)
            </label>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, overflow: 'hidden' }}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project about?"
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', padding: '14px 18px', color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
              Accent Color
            </label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
                    background: c,
                    border: color === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.15)',
                    transform: color === c ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.15s',
                  }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, color: '#fca5a5', fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '11px 22px', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', padding: '11px 26px', borderRadius: 14, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(99,102,241,0.4)', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
