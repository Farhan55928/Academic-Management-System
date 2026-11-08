import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { MdArrowBack, MdEdit, MdDelete, MdPushPin, MdOutlinePushPin } from 'react-icons/md';
import toast from 'react-hot-toast';
import {
  getCountry, updateCountry, deleteCountry, createItem, updateItem, deleteItem,
} from '../../api/abroad.js';
import { errorMessage, ErrorKind } from '../../api/errors.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import ErrorState from '../../components/UI/ErrorState.jsx';
import Modal from '../../components/UI/Modal.jsx';
import CountryFormModal from './CountryFormModal.jsx';
import Flag from './Flag.jsx';
import { COUNTRY_STATUS, FACTS } from './countries.js';
import OverviewTab from './tabs/OverviewTab.jsx';
import ChecklistTab from './tabs/ChecklistTab.jsx';
import ProgramsTab from './tabs/ProgramsTab.jsx';
import ContactsTab from './tabs/ContactsTab.jsx';
import VideosTab from './tabs/VideosTab.jsx';
import NotesTab from './tabs/NotesTab.jsx';

const TABS = [
  { key: 'overview',  label: 'Overview' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'programs',  label: 'Programs' },
  { key: 'contacts',  label: 'Professors' },
  { key: 'videos',    label: 'Videos' },
  { key: 'notes',     label: 'Notes' },
];

export default function AbroadCountryPage() {
  const { countryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { data, loading, error, reload } = useAsyncData(
    (signal) => getCountry(countryId, signal).then((r) => r.data),
    [countryId]
  );

  // Local copy so edits apply in place instead of refetching the whole log
  const [country, setCountry] = useState(null);
  useEffect(() => { if (data) setCountry(data); }, [data]);

  const [modal, setModal] = useState(null); // 'edit' | 'facts'
  const [saving, setSaving] = useState(false);

  const tab = TABS.find((t) => `#${t.key}` === location.hash)?.key ?? 'overview';
  const setTab = (key) => navigate(`/abroad/${countryId}#${key}`, { replace: true });

  // ─── Country-level edits ─────────────────────────────────
  const saveCountry = async (patch, successMsg) => {
    setSaving(true);
    try {
      const { data: doc } = await updateCountry(countryId, patch);
      setCountry((c) => ({ ...c, ...doc }));
      if (successMsg) toast.success(successMsg);
      setModal(null);
      return true;
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to save'));
      return false;
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${country.name} and everything in its log? This can't be undone.`)) return;
    try {
      await deleteCountry(countryId);
      toast.success(`${country.name} deleted`);
      navigate('/abroad');
    } catch (err) { toast.error(errorMessage(err, 'Failed to delete')); }
  };

  // ─── Section items (shared by every tab) ─────────────────
  const setList = (kind, fn) => setCountry((c) => ({ ...c, [kind]: fn(c[kind]) }));

  const items = {
    add: async (kind, body) => {
      const { data: doc } = await createItem(countryId, kind, body);
      setList(kind, (list) => [...list, doc]);
      return doc;
    },
    addMany: (kind, docs) => setList(kind, (list) => [...list, ...docs]),
    save: async (kind, id, body) => {
      const { data: doc } = await updateItem(kind, id, body);
      setList(kind, (list) => list.map((x) => (x._id === id ? doc : x)));
      return doc;
    },
    // Instant on screen, rolled back if the server says no (checkbox ticks, pins)
    patch: async (kind, id, body) => {
      let before;
      setList(kind, (list) => list.map((x) => {
        if (x._id !== id) return x;
        before = x;
        return { ...x, ...body };
      }));
      try { await updateItem(kind, id, body); }
      catch (err) {
        setList(kind, (list) => list.map((x) => (x._id === id ? before : x)));
        toast.error(errorMessage(err, 'Failed to save'));
      }
    },
    remove: async (kind, id, what = 'this item') => {
      if (!confirm(`Delete ${what}?`)) return;
      try {
        await deleteItem(kind, id);
        setList(kind, (list) => list.filter((x) => x._id !== id));
      } catch (err) { toast.error(errorMessage(err, 'Failed to delete')); }
    },
  };

  // ─── Render ──────────────────────────────────────────────
  if (loading && !country) return (
    <div className="abroad-loading" style={{ minHeight: '60vh' }}>
      <div className="loading loading-spinner loading-lg text-blue" />
    </div>
  );

  if (error && !country) return (
    <div className="page-wrapper">
      <Link to="/abroad" className="btn btn-ghost btn-sm mb-4"><MdArrowBack size={15} /> Abroad Log</Link>
      {error.kind === ErrorKind.NOTFOUND
        ? <ErrorState title="Country not found" description="It may have been deleted." />
        : <ErrorState description={error.message} onRetry={reload} />}
    </div>
  );

  if (!country) return null;

  const status = COUNTRY_STATUS[country.status] ?? COUNTRY_STATUS.exploring;
  const counts = {
    checklist: country.checklist.length,
    programs: country.programs.length,
    contacts: country.contacts.length,
    videos: country.videos.length,
    notes: country.notes.length,
  };

  return (
    <div className="abroad-page">
      {/* ── Cover hero ─────────────────────────────── */}
      <header
        className={`abroad-cover ${country.cover?.url ? '' : 'is-blank'}`}
        style={country.cover?.url ? { backgroundImage: `url("${country.cover.url}")` } : undefined}
      >
        <div className="abroad-cover-inner">
          <Link to="/abroad" className="abroad-back m-hide"><MdArrowBack size={17} /> Abroad Log</Link>

          <div className="abroad-cover-row">
            <div className="abroad-cover-title">
              <Flag code={country.code} size={34} className="abroad-cover-flag" />
              <div style={{ minWidth: 0 }}>
                <span className="pass-status" style={{ '--status': status.color }}>{status.label}</span>
                <h1>{country.name}</h1>
              </div>
            </div>

            <div className="abroad-cover-actions">
              <button
                className="abroad-glass-btn"
                onClick={() => saveCountry({ pinned: !country.pinned }, country.pinned ? 'Unpinned' : 'Pinned to the top')}
                aria-label={country.pinned ? 'Unpin' : 'Pin'}
                title={country.pinned ? 'Unpin' : 'Pin to the top'}
              >
                {country.pinned ? <MdPushPin size={18} /> : <MdOutlinePushPin size={18} />}
              </button>
              <button className="abroad-glass-btn" onClick={() => setModal('edit')}>
                <MdEdit size={17} /> <span>Edit</span>
              </button>
              <button className="abroad-glass-btn is-danger" onClick={handleDelete} aria-label="Delete country" title="Delete country">
                <MdDelete size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="abroad-body">
        {/* ── Key facts ───────────────────────────── */}
        <section className="abroad-facts">
          {FACTS.map((f) => (
            <button key={f.key} type="button" className="abroad-fact" onClick={() => setModal('facts')}>
              <span className="abroad-fact-label">{f.label}</span>
              {country.facts?.[f.key]
                ? <span className="abroad-fact-value">{country.facts[f.key]}</span>
                : <span className="abroad-fact-value is-empty">Add</span>}
            </button>
          ))}
        </section>

        {/* ── Tabs ────────────────────────────────── */}
        <div className="tab-bar abroad-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`tab-btn ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {counts[t.key] > 0 && <span className="abroad-tab-count">{counts[t.key]}</span>}
            </button>
          ))}
        </div>

        <div className="abroad-tab-panel anim-fade-in" key={tab}>
          {tab === 'overview'  && <OverviewTab country={country} onSave={(overview) => saveCountry({ overview }, 'Overview saved')} saving={saving} />}
          {tab === 'checklist' && <ChecklistTab countryId={countryId} list={country.checklist} items={items} />}
          {tab === 'programs'  && <ProgramsTab list={country.programs} items={items} />}
          {tab === 'contacts'  && <ContactsTab list={country.contacts} items={items} />}
          {tab === 'videos'    && <VideosTab list={country.videos} items={items} />}
          {tab === 'notes'     && <NotesTab list={country.notes} items={items} />}
        </div>
      </div>

      {modal === 'edit' && (
        <CountryFormModal
          initial={country}
          onClose={() => setModal(null)}
          onSave={(form) => saveCountry(form, 'Country updated')}
          saving={saving}
        />
      )}

      {modal === 'facts' && (
        <FactsModal
          facts={country.facts}
          onClose={() => setModal(null)}
          onSave={(facts) => saveCountry({ facts }, 'Key facts saved')}
          saving={saving}
        />
      )}
    </div>
  );
}

function FactsModal({ facts, onClose, onSave, saving }) {
  const [form, setForm] = useState(() =>
    Object.fromEntries(FACTS.map((f) => [f.key, facts?.[f.key] ?? '']))
  );

  return (
    <Modal
      title="Key facts"
      onClose={onClose}
      footer={<>
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>
          {saving ? 'Saving…' : 'Save facts'}
        </button>
      </>}
    >
      <div className="abroad-form-grid">
        {FACTS.map((f, i) => (
          <div key={f.key} className="form-group">
            <label className="form-label">{f.label}</label>
            <input
              className="form-input"
              placeholder={f.placeholder}
              value={form[f.key]}
              autoFocus={i === 0}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}
