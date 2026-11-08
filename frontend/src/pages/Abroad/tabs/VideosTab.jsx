import { useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdPlayCircle } from 'react-icons/md';
import toast from 'react-hot-toast';
import Modal from '../../../components/UI/Modal.jsx';
import Markdown from '../../../components/UI/Markdown.jsx';
import MarkdownEditor from '../../../components/UI/MarkdownEditor.jsx';
import VideoEmbed from '../../../components/UI/VideoEmbed.jsx';
import { parseVideo } from '../../../components/UI/videoUrl.js';
import { errorMessage } from '../../../api/errors.js';

export default function VideosTab({ list, items }) {
  const [editing, setEditing] = useState(null);

  const save = async (form) => {
    try {
      if (editing._id) await items.save('videos', editing._id, form);
      else await items.add('videos', form);
      setEditing(null);
    } catch (err) { toast.error(errorMessage(err, 'Failed to save')); }
  };

  return (
    <div>
      <div className="abroad-tab-head">
        <p className="abroad-kicker">Videos</p>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({})}><MdAdd size={16} /> Add video</button>
      </div>

      {list.length === 0 ? (
        <div className="abroad-tab-empty">
          <MdPlayCircle size={36} />
          <h3>No videos yet</h3>
          <p>Paste a public Facebook reel or YouTube link and it plays right here, with your note beside it.</p>
        </div>
      ) : (
        <div className="video-grid">
          {list.map((v) => (
            <article key={v._id} className="abroad-card video-card">
              <VideoEmbed url={v.url} title={v.title} />
              <div className="video-card-body">
                {v.title && <h3 className="abroad-card-title">{v.title}</h3>}
                {v.note
                  ? <div className="abroad-card-notes"><Markdown>{v.note}</Markdown></div>
                  : <p className="abroad-muted-line">No note yet.</p>}
                <div className="abroad-row-actions is-visible video-card-actions">
                  <button className="btn btn-ghost btn-icon" onClick={() => setEditing(v)} aria-label="Edit"><MdEdit size={15} /></button>
                  <button className="btn btn-ghost btn-icon is-danger" onClick={() => items.remove('videos', v._id, v.title ? `"${v.title}"` : 'this video')} aria-label="Delete"><MdDelete size={15} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && <VideoModal initial={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function VideoModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({ url: initial.url ?? '', title: initial.title ?? '', note: initial.note ?? '' });
  const [saving, setSaving] = useState(false);
  const valid = parseVideo(form.url.trim());

  const save = async () => {
    setSaving(true);
    await onSave({ ...form, url: form.url.trim() });
    setSaving(false);
  };

  return (
    <Modal
      title={initial._id ? 'Edit video' : 'Add video'}
      onClose={onClose}
      footer={<>
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={saving || !valid}>{saving ? 'Saving…' : 'Save'}</button>
      </>}
    >
      <div className="form-group">
        <label className="form-label">Link</label>
        <input
          className="form-input"
          type="url"
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
          placeholder="https://www.facebook.com/reel/… or https://youtu.be/…"
          autoFocus
        />
        {form.url.trim() && !valid && (
          <p className="form-hint is-error">Paste a Facebook or YouTube video link.</p>
        )}
        {valid && <p className="form-hint">{valid.platform === 'facebook' ? 'Facebook' : 'YouTube'} {valid.vertical ? 'reel/short' : 'video'} detected. It must be public to play here.</p>}
      </div>
      <div className="form-group">
        <label className="form-label">Title (optional)</label>
        <input className="form-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Cost of living in Munich" />
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Note</label>
        <MarkdownEditor value={form.note} onChange={(note) => setForm((f) => ({ ...f, note }))} minRows={5} placeholder="Key takeaways from this video…" />
      </div>
    </Modal>
  );
}
