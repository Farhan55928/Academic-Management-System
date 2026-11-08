import { useState } from 'react';
import { MdClose } from 'react-icons/md';
import Modal from '../../components/UI/Modal.jsx';
import MarkdownEditor from '../../components/UI/MarkdownEditor.jsx';

const normalizeTag = (t) => t.trim().toLowerCase().replace(/^#/, '').slice(0, 30);

// Shared by the Notes tab (create) and the note page (edit)
export default function NoteModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({
    title: initial.title ?? '',
    tags: initial.tags ?? [],
    format: initial.format ?? 'markdown',
    content: initial.content ?? '',
    pinned: initial.pinned ?? false,
  });
  const [tagDraft, setTagDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const addTags = (raw) => {
    const next = raw.split(',').map(normalizeTag).filter(Boolean);
    if (next.length) setForm((f) => ({ ...f, tags: [...new Set([...f.tags, ...next])] }));
    setTagDraft('');
  };
  const removeTag = (tag) => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));

  const onTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTags(tagDraft); }
    else if (e.key === 'Backspace' && !tagDraft && form.tags.length) removeTag(form.tags.at(-1));
  };

  const save = async () => {
    setSaving(true);
    // A tag still being typed counts too
    const tags = [...new Set([...form.tags, ...tagDraft.split(',').map(normalizeTag).filter(Boolean)])];
    await onSave({ ...form, tags });
    setSaving(false);
  };

  return (
    <Modal
      title={initial._id ? 'Edit note' : 'New note'}
      onClose={onClose}
      footer={<>
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={saving || !(form.title.trim() || form.content.trim())}>{saving ? 'Saving…' : 'Save note'}</button>
      </>}
    >
      <div className="form-group">
        <label className="form-label">Title</label>
        <input className="form-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Ireland — Fit Assessment" autoFocus />
      </div>
      <div className="form-group">
        <label className="form-label">Tags</label>
        <div className="tag-input">
          {form.tags.map((t) => (
            <span key={t} className="note-tag">
              #{t}
              <button type="button" onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`}><MdClose size={12} /></button>
            </span>
          ))}
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={onTagKey}
            onBlur={() => tagDraft && addTags(tagDraft)}
            placeholder={form.tags.length ? '' : 'e.g. scholarship, phd — press Enter'}
          />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Format</label>
        <div className="abroad-segment">
          {[['markdown', 'Markdown'], ['text', 'Plain text']].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`abroad-segment-btn ${form.format === value ? 'active' : ''}`}
              onClick={() => setForm((f) => ({ ...f, format: value }))}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Note</label>
        <MarkdownEditor
          key={form.format}
          value={form.content}
          onChange={(content) => setForm((f) => ({ ...f, content }))}
          markdown={form.format === 'markdown'}
          minRows={14}
          placeholder={form.format === 'markdown' ? '## Heading\n- point\n**bold**, [link](https://…)' : 'Write freely…'}
        />
      </div>
    </Modal>
  );
}
