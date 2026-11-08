import { useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdOpenInNew, MdContentCopy, MdPerson, MdMarkEmailRead } from 'react-icons/md';
import toast from 'react-hot-toast';
import Modal from '../../../components/UI/Modal.jsx';
import Markdown from '../../../components/UI/Markdown.jsx';
import MarkdownEditor from '../../../components/UI/MarkdownEditor.jsx';
import { errorMessage } from '../../../api/errors.js';
import { CONTACT_STATUS, daysAgo, toDateInput } from '../countries.js';
import { StatusSelect } from './ProgramsTab.jsx';

const EMPTY = { name: '', university: '', researchArea: '', email: '', profileUrl: '', status: 'not_contacted', lastContactedAt: '', notes: '' };

const initials = (name) => name.replace(/^(prof\.?|dr\.?)\s+/i, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function ContactsTab({ list, items }) {
  const [editing, setEditing] = useState(null);

  const save = async (form) => {
    try {
      if (editing._id) await items.save('contacts', editing._id, form);
      else await items.add('contacts', form);
      setEditing(null);
    } catch (err) { toast.error(errorMessage(err, 'Failed to save')); }
  };

  // Moving to "emailed" stamps today's date, since that's what the date is for
  const changeStatus = (c, status) => {
    const patch = { status };
    if (status === 'emailed' && c.status !== 'emailed') patch.lastContactedAt = new Date().toISOString();
    items.patch('contacts', c._id, patch);
  };

  const copyEmail = async (email) => {
    try { await navigator.clipboard.writeText(email); toast.success('Email copied'); }
    catch { toast.error("Couldn't copy"); }
  };

  return (
    <div>
      <div className="abroad-tab-head">
        <p className="abroad-kicker">Professors & supervisors</p>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({})}><MdAdd size={16} /> Add professor</button>
      </div>

      {list.length === 0 ? (
        <div className="abroad-tab-empty">
          <MdPerson size={36} />
          <h3>No professors yet</h3>
          <p>For PhD applications: keep track of potential supervisors, their research, and where each cold email stands.</p>
        </div>
      ) : (
        <div className="abroad-cards">
          {list.map((c) => {
            const s = CONTACT_STATUS[c.status];
            const ago = daysAgo(c.lastContactedAt);
            return (
              <article key={c._id} className="abroad-card contact-card">
                <div className="abroad-card-head">
                  <div className="contact-avatar" style={{ '--tone': s.color, '--tone-bg': s.bg }}>{initials(c.name) || '?'}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 className="abroad-card-title">{c.name}</h3>
                    {(c.university || c.researchArea) && (
                      <p className="abroad-card-sub">{[c.university, c.researchArea].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                </div>

                {(c.email || ago) && (
                  <div className="contact-lines">
                    {c.email && (
                      <button className="contact-email" onClick={() => copyEmail(c.email)} title="Copy email">
                        <span>{c.email}</span> <MdContentCopy size={13} />
                      </button>
                    )}
                    {ago && <span className="contact-ago"><MdMarkEmailRead size={14} /> Last contacted {ago}</span>}
                  </div>
                )}

                {c.notes && <div className="abroad-card-notes"><Markdown>{c.notes}</Markdown></div>}

                <div className="abroad-card-foot">
                  <StatusSelect value={c.status} options={CONTACT_STATUS} onChange={(status) => changeStatus(c, status)} />
                  <div className="abroad-row-actions is-visible">
                    {c.profileUrl && (
                      <a className="btn btn-ghost btn-icon" href={c.profileUrl} target="_blank" rel="noopener noreferrer" aria-label="Open profile" title="Open profile">
                        <MdOpenInNew size={15} />
                      </a>
                    )}
                    <button className="btn btn-ghost btn-icon" onClick={() => setEditing(c)} aria-label="Edit"><MdEdit size={15} /></button>
                    <button className="btn btn-ghost btn-icon is-danger" onClick={() => items.remove('contacts', c._id, c.name)} aria-label="Delete"><MdDelete size={15} /></button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && <ContactModal initial={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function ContactModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial, lastContactedAt: toDateInput(initial.lastContactedAt) });
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setSaving(true);
    await onSave(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, form[k]])));
    setSaving(false);
  };

  return (
    <Modal
      title={initial._id ? 'Edit professor' : 'Add professor'}
      onClose={onClose}
      footer={<>
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={saving || !form.name.trim()}>{saving ? 'Saving…' : 'Save'}</button>
      </>}
    >
      <div className="abroad-form-grid">
        <div className="form-group is-wide">
          <label className="form-label">Name</label>
          <input className="form-input" value={form.name} onChange={set('name')} placeholder="e.g. Prof. Anna Weber" autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">University</label>
          <input className="form-input" value={form.university} onChange={set('university')} />
        </div>
        <div className="form-group">
          <label className="form-label">Research area</label>
          <input className="form-input" value={form.researchArea} onChange={set('researchArea')} placeholder="e.g. Robotics, SLAM" />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email} onChange={set('email')} />
        </div>
        <div className="form-group">
          <label className="form-label">Profile / lab page</label>
          <input className="form-input" type="url" value={form.profileUrl} onChange={set('profileUrl')} placeholder="https://…" />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={set('status')}>
            {Object.entries(CONTACT_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Last contacted</label>
          <input className="form-input" type="date" value={form.lastContactedAt} onChange={set('lastContactedAt')} />
        </div>
        <div className="form-group is-wide" style={{ marginBottom: 0 }}>
          <label className="form-label">Notes</label>
          <MarkdownEditor value={form.notes} onChange={(notes) => setForm((f) => ({ ...f, notes }))} minRows={4} placeholder="Papers you read, what you wrote, their reply…" />
        </div>
      </div>
    </Modal>
  );
}
