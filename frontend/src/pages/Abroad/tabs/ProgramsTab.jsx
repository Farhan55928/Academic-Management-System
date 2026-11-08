import { useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdOpenInNew, MdEvent, MdSchool } from 'react-icons/md';
import toast from 'react-hot-toast';
import Modal from '../../../components/UI/Modal.jsx';
import Markdown from '../../../components/UI/Markdown.jsx';
import MarkdownEditor from '../../../components/UI/MarkdownEditor.jsx';
import { errorMessage } from '../../../api/errors.js';
import { PROGRAM_STATUS, relativeDays, toDateInput, formatDate } from '../countries.js';

const EMPTY = { university: '', program: '', degree: 'MS', deadline: '', tuition: '', funding: '', link: '', status: 'researching', notes: '' };

export default function ProgramsTab({ list, items }) {
  const [editing, setEditing] = useState(null); // {} for new, item for edit

  // Grouped in pipeline order so "what needs doing" reads top to bottom
  const groups = Object.keys(PROGRAM_STATUS)
    .map((status) => ({ status, programs: list.filter((p) => p.status === status) }))
    .filter((g) => g.programs.length > 0);

  const save = async (form) => {
    try {
      if (editing._id) await items.save('programs', editing._id, form);
      else await items.add('programs', form);
      setEditing(null);
    } catch (err) { toast.error(errorMessage(err, 'Failed to save')); }
  };

  return (
    <div>
      <div className="abroad-tab-head">
        <p className="abroad-kicker">Universities & programs</p>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({})}><MdAdd size={16} /> Add program</button>
      </div>

      {list.length === 0 ? (
        <div className="abroad-tab-empty">
          <MdSchool size={36} />
          <h3>No programs yet</h3>
          <p>Track each university and program you're considering, with its deadline, tuition, funding and where your application stands.</p>
        </div>
      ) : groups.map((g) => (
        <section key={g.status} className="abroad-group">
          <h4 className="abroad-group-title" style={{ '--tone': PROGRAM_STATUS[g.status].color }}>
            {PROGRAM_STATUS[g.status].label} <span>{g.programs.length}</span>
          </h4>
          <div className="abroad-cards">
            {g.programs.map((p) => <ProgramCard key={p._id} program={p} items={items} onEdit={() => setEditing(p)} />)}
          </div>
        </section>
      ))}

      {editing && <ProgramModal initial={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function ProgramCard({ program: p, items, onEdit }) {
  const due = !['applied', 'interview', 'accepted', 'rejected'].includes(p.status) && relativeDays(p.deadline);

  return (
    <article className="abroad-card">
      <div className="abroad-card-head">
        <div style={{ minWidth: 0 }}>
          <h3 className="abroad-card-title">{p.university}</h3>
          {p.program && <p className="abroad-card-sub">{p.program}</p>}
        </div>
        <span className="abroad-degree">{p.degree}</span>
      </div>

      <dl className="abroad-meta">
        {p.deadline && (
          <div>
            <dt>Deadline</dt>
            <dd>
              {formatDate(p.deadline)}
              {due && <span className={`abroad-due is-${due.tone}`}><MdEvent size={12} /> {due.text}</span>}
            </dd>
          </div>
        )}
        {p.tuition && <div><dt>Tuition</dt><dd>{p.tuition}</dd></div>}
        {p.funding && <div><dt>Funding</dt><dd>{p.funding}</dd></div>}
      </dl>

      {p.notes && <div className="abroad-card-notes"><Markdown>{p.notes}</Markdown></div>}

      <div className="abroad-card-foot">
        <StatusSelect
          value={p.status}
          options={PROGRAM_STATUS}
          onChange={(status) => items.patch('programs', p._id, { status })}
        />
        <div className="abroad-row-actions is-visible">
          {p.link && (
            <a className="btn btn-ghost btn-icon" href={p.link} target="_blank" rel="noopener noreferrer" aria-label="Open program page" title="Open program page">
              <MdOpenInNew size={15} />
            </a>
          )}
          <button className="btn btn-ghost btn-icon" onClick={onEdit} aria-label="Edit"><MdEdit size={15} /></button>
          <button className="btn btn-ghost btn-icon is-danger" onClick={() => items.remove('programs', p._id, p.university)} aria-label="Delete"><MdDelete size={15} /></button>
        </div>
      </div>
    </article>
  );
}

// A native <select> styled as a status pill: one tap to move along the pipeline
export function StatusSelect({ value, options, onChange }) {
  const s = options[value];
  return (
    <select
      className="abroad-status-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ '--tone': s?.color, '--tone-bg': s?.bg }}
      aria-label="Status"
    >
      {Object.entries(options).map(([key, o]) => <option key={key} value={key}>{o.label}</option>)}
    </select>
  );
}

function ProgramModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial, deadline: toDateInput(initial.deadline) });
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setSaving(true);
    const body = Object.fromEntries(Object.keys(EMPTY).map((k) => [k, form[k]]));
    await onSave(body);
    setSaving(false);
  };

  return (
    <Modal
      title={initial._id ? 'Edit program' : 'Add program'}
      onClose={onClose}
      footer={<>
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={saving || !form.university.trim()}>{saving ? 'Saving…' : 'Save'}</button>
      </>}
    >
      <div className="abroad-form-grid">
        <div className="form-group is-wide">
          <label className="form-label">University</label>
          <input className="form-input" value={form.university} onChange={set('university')} placeholder="e.g. TU Munich" autoFocus />
        </div>
        <div className="form-group is-wide">
          <label className="form-label">Program</label>
          <input className="form-input" value={form.program} onChange={set('program')} placeholder="e.g. MSc Informatics" />
        </div>
        <div className="form-group">
          <label className="form-label">Degree</label>
          <select className="form-select" value={form.degree} onChange={set('degree')}>
            <option value="MS">Master's</option>
            <option value="PhD">PhD</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={set('status')}>
            {Object.entries(PROGRAM_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Deadline</label>
          <input className="form-input" type="date" value={form.deadline} onChange={set('deadline')} />
        </div>
        <div className="form-group">
          <label className="form-label">Tuition</label>
          <input className="form-input" value={form.tuition} onChange={set('tuition')} placeholder="e.g. €0 + €150 semester fee" />
        </div>
        <div className="form-group">
          <label className="form-label">Funding</label>
          <input className="form-input" value={form.funding} onChange={set('funding')} placeholder="e.g. DAAD, TA/RA" />
        </div>
        <div className="form-group">
          <label className="form-label">Link</label>
          <input className="form-input" type="url" value={form.link} onChange={set('link')} placeholder="https://…" />
        </div>
        <div className="form-group is-wide" style={{ marginBottom: 0 }}>
          <label className="form-label">Notes</label>
          <MarkdownEditor value={form.notes} onChange={(notes) => setForm((f) => ({ ...f, notes }))} minRows={4} placeholder="Requirements, GRE, LoRs, portal quirks…" />
        </div>
      </div>
    </Modal>
  );
}
