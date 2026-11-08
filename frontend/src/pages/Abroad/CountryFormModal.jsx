import { useMemo, useState } from 'react';
import { MdSearch, MdCheck } from 'react-icons/md';
import Modal from '../../components/UI/Modal.jsx';
import ImageUpload from '../../components/UI/ImageUpload.jsx';
import Flag from './Flag.jsx';
import { COUNTRIES, COUNTRY_STATUS } from './countries.js';

// Kept separate so typing in the search box doesn't re-render the page behind it
export default function CountryFormModal({ initial, existingCodes = [], onClose, onSave, saving }) {
  const editing = Boolean(initial?._id);
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    code: initial?.code ?? '',
    status: initial?.status ?? 'exploring',
    cover: initial?.cover?.url ? initial.cover : null,
  });
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q) : COUNTRIES;
    return list.slice(0, 60);
  }, [query]);

  const choose = (c) => setForm((f) => ({ ...f, name: c.name, code: c.code }));

  return (
    <Modal
      title={editing ? 'Edit Country' : 'Add a Country'}
      onClose={onClose}
      footer={<>
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={() => onSave({ ...form, cover: form.cover ?? null })}
          disabled={saving || uploading || !form.name.trim()}
        >
          {saving ? 'Saving…' : uploading ? 'Uploading…' : editing ? 'Save changes' : 'Add country'}
        </button>
      </>}
    >
      <div className="form-group">
        <label className="form-label">Country</label>
        <div className="abroad-picker">
          <div className="abroad-picker-search">
            <MdSearch size={18} />
            <input
              className="form-input"
              placeholder="Search countries…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus={!editing}
            />
          </div>
          <div className="abroad-picker-list" role="listbox" aria-label="Countries">
            {matches.map((c) => {
              const selected = form.code === c.code;
              const taken = !selected && existingCodes.includes(c.code);
              return (
                <button
                  key={c.code}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`abroad-picker-option ${selected ? 'is-selected' : ''}`}
                  onClick={() => choose(c)}
                  disabled={taken}
                  title={taken ? 'Already in your log' : undefined}
                >
                  <Flag code={c.code} size={16} />
                  <span>{c.name}</span>
                  {selected && <MdCheck size={17} className="abroad-picker-check" />}
                  {taken && <span className="abroad-picker-taken">Added</span>}
                </button>
              );
            })}
            {matches.length === 0 && <p className="abroad-picker-empty">No country matches “{query}”.</p>}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Status</label>
        <div className="abroad-segment">
          {Object.entries(COUNTRY_STATUS).map(([value, s]) => (
            <button
              key={value}
              type="button"
              className={`abroad-segment-btn ${form.status === value ? 'active' : ''}`}
              style={form.status === value ? { '--seg': s.color } : undefined}
              onClick={() => setForm((f) => ({ ...f, status: value }))}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Cover image</label>
        <ImageUpload
          value={form.cover}
          onChange={(cover) => setForm((f) => ({ ...f, cover }))}
          onBusyChange={setUploading}
        />
      </div>
    </Modal>
  );
}
