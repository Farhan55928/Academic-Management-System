import { useState } from 'react';
import {
  MdAdd, MdCheck, MdEdit, MdDelete, MdExpandMore, MdChevronRight, MdEvent, MdContentPaste, MdFactCheck,
} from 'react-icons/md';
import toast from 'react-hot-toast';
import Modal from '../../../components/UI/Modal.jsx';
import Markdown from '../../../components/UI/Markdown.jsx';
import MarkdownEditor from '../../../components/UI/MarkdownEditor.jsx';
import { importChecklist } from '../../../api/abroad.js';
import { errorMessage } from '../../../api/errors.js';
import { relativeDays, toDateInput, formatDate } from '../countries.js';

export default function ChecklistTab({ countryId, list, items }) {
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);   // item being edited in the modal
  const [importing, setImporting] = useState(false);
  const [open, setOpen] = useState(() => new Set());
  const [hideDone, setHideDone] = useState(false);

  const done = list.filter((i) => i.isDone).length;
  const pct = list.length ? Math.round((done / list.length) * 100) : 0;
  const visible = hideDone ? list.filter((i) => !i.isDone) : list;

  const quickAdd = async (e) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setAdding(true);
    try {
      await items.add('checklist', { title });
      setDraft('');
    } catch (err) { toast.error(errorMessage(err, 'Failed to add')); }
    finally { setAdding(false); }
  };

  const toggleOpen = (id) => setOpen((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div className="abroad-checklist">
      {/* Progress */}
      <div className="abroad-panel checklist-progress">
        <div className="checklist-progress-head">
          <div>
            <p className="abroad-kicker">Required documents</p>
            <p className="checklist-progress-count"><strong>{done}</strong> of {list.length} ready</p>
          </div>
          <span className="checklist-progress-pct" style={{ color: pct === 100 && list.length ? '#10b981' : 'var(--navy)' }}>{pct}%</span>
        </div>
        <div className="pass-meter is-large"><span style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : '#3b82f6' }} /></div>
      </div>

      {/* Quick add + tools */}
      <form className="checklist-add" onSubmit={quickAdd}>
        <input
          className="form-input"
          placeholder="Add a document, e.g. Passport (valid 6+ months)…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={adding || !draft.trim()} aria-label="Add item">
          <MdAdd size={18} /> <span className="abroad-hide-sm">Add</span>
        </button>
      </form>
      <div className="checklist-tools">
        <button className="btn btn-ghost btn-sm" onClick={() => setImporting(true)}>
          <MdContentPaste size={15} /> Import from markdown
        </button>
        {done > 0 && (
          <label className="checklist-hide">
            <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />
            Hide completed
          </label>
        )}
      </div>

      {/* Items */}
      {list.length === 0 ? (
        <div className="abroad-tab-empty">
          <MdFactCheck size={36} />
          <h3>No documents yet</h3>
          <p>Add them one by one above, or paste a markdown list like <code>- [ ] Passport</code> with “Import from markdown”.</p>
        </div>
      ) : (
        <ul className="checklist-list">
          {visible.map((item) => {
            const due = !item.isDone && relativeDays(item.dueDate);
            const isOpen = open.has(item._id);
            return (
              <li key={item._id} className={`checklist-item ${item.isDone ? 'is-done' : ''}`}>
                <div className="checklist-row">
                  <button
                    className="checklist-check"
                    onClick={() => items.patch('checklist', item._id, { isDone: !item.isDone })}
                    aria-label={item.isDone ? 'Mark not done' : 'Mark done'}
                    aria-pressed={item.isDone}
                  >
                    <MdCheck size={16} />
                  </button>

                  <button className="checklist-title" onClick={() => item.note && toggleOpen(item._id)} disabled={!item.note}>
                    <span>{item.title}</span>
                    {item.note && (isOpen ? <MdExpandMore size={18} /> : <MdChevronRight size={18} />)}
                  </button>

                  {due && (
                    <span className={`abroad-due is-${due.tone}`} title={formatDate(item.dueDate)}>
                      <MdEvent size={13} /> {due.text}
                    </span>
                  )}

                  <div className="abroad-row-actions">
                    <button className="btn btn-ghost btn-icon" onClick={() => setEditing(item)} aria-label="Edit"><MdEdit size={15} /></button>
                    <button className="btn btn-ghost btn-icon is-danger" onClick={() => items.remove('checklist', item._id, `"${item.title}"`)} aria-label="Delete"><MdDelete size={15} /></button>
                  </div>
                </div>
                {item.note && isOpen && (
                  <div className="checklist-note"><Markdown>{item.note}</Markdown></div>
                )}
              </li>
            );
          })}
          {visible.length === 0 && <li className="abroad-muted-line">Everything is done. 🎉</li>}
        </ul>
      )}

      {editing && (
        <ChecklistItemModal
          item={editing}
          onClose={() => setEditing(null)}
          onSave={async (body) => {
            try {
              await items.save('checklist', editing._id, body);
              setEditing(null);
              if (body.note) setOpen((prev) => new Set(prev).add(editing._id));
            } catch (err) { toast.error(errorMessage(err, 'Failed to save')); }
          }}
        />
      )}

      {importing && (
        <ImportModal
          onClose={() => setImporting(false)}
          onImport={async (markdown) => {
            try {
              const { data } = await importChecklist(countryId, markdown);
              items.addMany('checklist', data);
              toast.success(`Imported ${data.length} item${data.length === 1 ? '' : 's'}`);
              setImporting(false);
            } catch (err) { toast.error(errorMessage(err, 'Import failed')); }
          }}
        />
      )}
    </div>
  );
}

function ChecklistItemModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    title: item.title,
    dueDate: toDateInput(item.dueDate),
    note: item.note ?? '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => { setSaving(true); await onSave(form); setSaving(false); };

  return (
    <Modal
      title="Edit document"
      onClose={onClose}
      footer={<>
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={saving || !form.title.trim()}>{saving ? 'Saving…' : 'Save'}</button>
      </>}
    >
      <div className="form-group">
        <label className="form-label">Document</label>
        <input className="form-input" value={form.title} autoFocus onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      </div>
      <div className="form-group">
        <label className="form-label">Due date (optional)</label>
        <input className="form-input" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Note</label>
        <MarkdownEditor
          value={form.note}
          onChange={(note) => setForm((f) => ({ ...f, note }))}
          minRows={5}
          placeholder="Where to get it, how long it takes, fees, links…"
        />
      </div>
    </Modal>
  );
}

function ImportModal({ onClose, onImport }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => { setBusy(true); await onImport(text); setBusy(false); };

  return (
    <Modal
      title="Import checklist"
      onClose={onClose}
      footer={<>
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={run} disabled={busy || !text.trim()}>{busy ? 'Importing…' : 'Import'}</button>
      </>}
    >
      <p className="text-sm text-muted" style={{ marginBottom: 12 }}>
        Paste a markdown list. <code>- [ ]</code> becomes a to-do, <code>- [x]</code> is imported as already done, and plain <code>-</code> or <code>1.</code> items work too. Items are added after your existing ones.
      </p>
      <MarkdownEditor
        value={text}
        onChange={setText}
        minRows={10}
        autoFocus
        placeholder={'- [ ] Passport (valid 6+ months)\n- [ ] IELTS 6.5\n- [x] Bachelor transcript\n- [ ] Blocked account (€11,904)'}
      />
    </Modal>
  );
}
