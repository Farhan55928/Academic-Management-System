import { useState } from 'react';
import { Link } from 'react-router';
import { MdAdd, MdPushPin, MdChecklist, MdSchool, MdPerson, MdPlayCircle, MdNotes, MdPublic } from 'react-icons/md';
import toast from 'react-hot-toast';
import { getCountries, createCountry } from '../../api/abroad.js';
import { errorMessage } from '../../api/errors.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import ErrorState from '../../components/UI/ErrorState.jsx';
import CountryFormModal from './CountryFormModal.jsx';
import Flag from './Flag.jsx';
import { COUNTRY_STATUS, FACTS } from './countries.js';

export default function AbroadCountriesPage() {
  const { data, loading, error, reload } = useAsyncData(
    (signal) => getCountries(signal).then((r) => r.data), []
  );
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const countries = data ?? [];
  const shortlisted = countries.filter((c) => c.status === 'shortlisted' || c.status === 'applying').length;
  const docs = countries.reduce((acc, c) => ({
    done: acc.done + c.checklist.done,
    total: acc.total + c.checklist.total,
  }), { done: 0, total: 0 });

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await createCountry(form);
      toast.success(`${form.name} added`);
      setModal(false);
      reload();
    } catch (err) { toast.error(errorMessage(err, 'Failed to add country')); }
    finally { setSaving(false); }
  };

  return (
    <div className="abroad-page">
      {/* ── Hero ───────────────────────────────────── */}
      <header className="abroad-hero">
        <div className="abroad-hero-inner">
          <p className="abroad-eyebrow">Higher Studies Abroad</p>
          <div className="abroad-hero-row">
            <div>
              <h1 className="abroad-hero-title">Abroad Log</h1>
              <p className="abroad-hero-sub">Everything you learn about each country, in one place.</p>
            </div>
            <button className="abroad-cta" onClick={() => setModal(true)}>
              <MdAdd size={20} /> Add country
            </button>
          </div>

          <div className="abroad-hero-stats">
            <div className="abroad-hero-stat">
              <span className="abroad-hero-stat-label">Countries</span>
              <span className="abroad-hero-stat-value" style={{ color: '#60a5fa' }}>{countries.length}</span>
            </div>
            <div className="abroad-hero-stat">
              <span className="abroad-hero-stat-label">Shortlisted</span>
              <span className="abroad-hero-stat-value" style={{ color: '#fbbf24' }}>{shortlisted}</span>
            </div>
            <div className="abroad-hero-stat">
              <span className="abroad-hero-stat-label">Documents ready</span>
              <span className="abroad-hero-stat-value" style={{ color: '#34d399' }}>
                {docs.done}<small>/{docs.total}</small>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Cards ──────────────────────────────────── */}
      <div className="abroad-body">
        {loading && !data ? (
          <div className="abroad-loading"><div className="loading loading-spinner loading-lg text-blue" /></div>
        ) : error ? (
          <ErrorState description={error.message} onRetry={reload} />
        ) : countries.length === 0 ? (
          <div className="abroad-empty">
            <MdPublic size={44} />
            <h3>No countries yet</h3>
            <p>Add the first country you're considering. Its overview, document checklist, programs, professors, videos and notes will all live inside it.</p>
            <button className="abroad-cta" onClick={() => setModal(true)}><MdAdd size={20} /> Add country</button>
          </div>
        ) : (
          <div className="abroad-grid">
            {countries.map((c) => <CountryCard key={c._id} country={c} />)}
          </div>
        )}
      </div>

      {modal && (
        <CountryFormModal
          existingCodes={countries.map((c) => c.code).filter(Boolean)}
          onClose={() => setModal(false)}
          onSave={handleCreate}
          saving={saving}
        />
      )}
    </div>
  );
}

// A boarding pass: the cover is the "destination", the torn-off stub below
// carries the paperwork — document progress and what's been collected so far.
function CountryCard({ country }) {
  const status = COUNTRY_STATUS[country.status] ?? COUNTRY_STATUS.exploring;
  const { done, total } = country.checklist;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const facts = FACTS.filter((f) => country.facts?.[f.key]).slice(0, 3);
  const counts = [
    { icon: <MdSchool size={14} />, n: country.counts.programs, label: 'programs' },
    { icon: <MdPerson size={14} />, n: country.counts.contacts, label: 'professors' },
    { icon: <MdPlayCircle size={14} />, n: country.counts.videos, label: 'videos' },
    { icon: <MdNotes size={14} />, n: country.counts.notes, label: 'notes' },
  ].filter((x) => x.n > 0);

  return (
    <Link to={`/abroad/${country._id}`} className={`pass ${country.status === 'dropped' ? 'is-dropped' : ''}`}>
      <div
        className={`pass-cover ${country.cover?.url ? '' : 'is-blank'}`}
        style={country.cover?.url ? { backgroundImage: `url("${country.cover.url}")` } : undefined}
      >
        <div className="pass-cover-top">
          <span className="pass-status" style={{ '--status': status.color }}>{status.label}</span>
          {country.pinned && <span className="pass-pin" title="Pinned"><MdPushPin size={15} /></span>}
        </div>
        <div className="pass-cover-bottom">
          <Flag code={country.code} size={26} className="pass-flag" />
          <h3 className="pass-name">{country.name}</h3>
        </div>
      </div>

      <div className="pass-stub">
        {facts.length > 0 && (
          <div className="pass-facts">
            {facts.map((f) => (
              <span key={f.key} className="pass-fact">
                <span className="pass-fact-label">{f.label}</span>
                <span className="pass-fact-value">{country.facts[f.key]}</span>
              </span>
            ))}
          </div>
        )}

        <div className="pass-docs">
          <div className="pass-docs-head">
            <span><MdChecklist size={15} /> Documents</span>
            <strong>{total > 0 ? `${done}/${total}` : '—'}</strong>
          </div>
          <div className="pass-meter"><span style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : '#3b82f6' }} /></div>
        </div>

        {counts.length > 0 && (
          <div className="pass-counts">
            {counts.map((x) => (
              <span key={x.label} title={`${x.n} ${x.label}`}>{x.icon}{x.n}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
