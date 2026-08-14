import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { MdAdd, MdChecklist, MdArrowForward, MdDelete, MdEdit, MdClose, MdCheck } from 'react-icons/md';
import toast from 'react-hot-toast';
import { getWeeks, createWeek, updateWeek, deleteWeek } from '../../api/backlog.js';
import { getSemesters } from '../../api/semesters.js';
import { meterColor, gradientFor } from './backlogUtils.js';

export default function BacklogWeeksPage() {
  const [weeks,     setWeeks]     = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [filter,    setFilter]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState({ weekNumber: 1, semester: '' });
  const [editId,    setEditId]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const navigate = useNavigate();

  const load = (semesterId) =>
    getWeeks(semesterId).then(r => setWeeks(r.data)).catch(() => toast.error('Failed to load'));

  // Default the filter to the active semester — that's the term you actually work in
  useEffect(() => {
    getSemesters()
      .then(r => {
        setSemesters(r.data);
        const active = r.data.find(s => s.isActive);
        const initial = active ? active._id : '';
        setFilter(initial);
        return load(initial);
      })
      .catch(() => toast.error('Failed to load semesters'))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => ({
    done:      weeks.reduce((n, w) => n + w.progress.done, 0),
    total:     weeks.reduce((n, w) => n + w.progress.total, 0),
    pending:   weeks.reduce((n, w) => n + w.unfinished, 0),
  }), [weeks]);

  const pct = totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0;

  const handleFilter = (semesterId) => { setFilter(semesterId); load(semesterId); };

  const semesterLabel = (id) => {
    const s = semesters.find(x => x._id === id);
    return s ? `${s.name} ${s.year}` : '';
  };

  const openAdd = () => {
    const active = semesters.find(s => s.isActive);
    const next = weeks.length > 0 ? Math.max(...weeks.map(w => w.weekNumber)) + 1 : 1;
    setForm({ weekNumber: next, semester: filter || active?._id || semesters[0]?._id || '' });
    setEditId(null);
    setModal(true);
  };

  const openEdit = (e, w) => {
    e.preventDefault(); e.stopPropagation();
    setForm({ weekNumber: w.weekNumber, semester: w.semester });
    setEditId(w._id);
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.weekNumber || !form.semester) return toast.error('Week number and semester are required');
    setSaving(true);
    try {
      if (editId) { await updateWeek(editId, form); toast.success('Week updated'); }
      else        { await createWeek(form);         toast.success('Week created'); }
      setModal(false);
      load(filter);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm('Delete this week? Every section, subsection and step inside it will be removed.')) return;
    try { await deleteWeek(id); toast.success('Deleted'); load(filter); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <>
      <div style={{ minHeight: '100vh', background: '#f0f4f9' }}>

        {/* ── Hero Header ─────────────────────────────── */}
        <div className="hero-section" style={{
          background: 'linear-gradient(135deg, #0f1e3c 0%, #1a2f5e 60%, #1e3a6e 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* pointerEvents:none so the overlay can't swallow clicks on the cards
              that tuck under the hero's bottom edge */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.25em', color: 'rgba(96,165,250,0.9)', textTransform: 'uppercase', marginBottom: 12 }}>
              Academic Planning
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
              <div>
                <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 48, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8 }}>
                  Backlog
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, fontWeight: 400 }}>
                  Weekly checklists of everything still pending
                </p>
              </div>
              <button
                onClick={openAdd}
                disabled={semesters.length === 0}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#3b82f6', color: '#fff',
                  padding: '14px 28px', borderRadius: 16, border: 'none',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  opacity: semesters.length === 0 ? 0.5 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(59,130,246,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.4)'; }}
              >
                <MdAdd size={22} /> Add New Week
              </button>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'flex', gap: 24, marginTop: 40, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {[
                { label: 'Steps Complete', value: `${totals.done}/${totals.total}`, color: '#60a5fa' },
                { label: 'Weeks Tracked',  value: `${weeks.length}`,                color: '#34d399' },
                { label: 'Still Pending',  value: `${totals.pending}`,              color: totals.pending > 0 ? '#fbbf24' : '#34d399' },
              ].map(stat => (
                <div key={stat.label} style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '20px 32px' }}>
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{stat.label}</p>
                  <p style={{ fontSize: 30, fontWeight: 900, color: stat.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>{stat.value}</p>
                </div>
              ))}

              {semesters.length > 0 && (
                <div style={{ marginLeft: 'auto' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
                    Semester
                  </label>
                  <select
                    value={filter}
                    onChange={e => handleFilter(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
                      padding: '16px 20px', color: '#fff', fontSize: 14, fontWeight: 600,
                      outline: 'none', cursor: 'pointer', minWidth: 200,
                    }}
                  >
                    <option value="" style={{ background: '#1a2f5e' }}>All semesters</option>
                    {semesters.map(s => (
                      <option key={s._id} value={s._id} style={{ background: '#1a2f5e' }}>{s.name} {s.year}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Overall progress rail */}
            {totals.total > 0 && (
              <div style={{ marginTop: 28, maxWidth: 520 }}>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${meterColor(pct)}, #60a5fa)`, borderRadius: 999, transition: 'width 0.6s ease' }} />
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 8, fontWeight: 600 }}>
                  {pct}% of all tracked steps complete
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Week Cards ──────────────────────────────── */}
        <div className="content-section-no-top" style={{ marginTop: -36 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <div style={{ width: 40, height: 40, border: '3px solid #dbeafe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : semesters.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 24, padding: 80, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>📅</p>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>No Semesters Yet</h3>
              <p style={{ color: '#64748b', marginBottom: 24 }}>Backlog weeks belong to a semester. Create one first.</p>
              <button onClick={() => navigate('/semesters')} style={{ background: '#3b82f6', color: '#fff', padding: '12px 28px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                Go to Semesters
              </button>
            </div>
          ) : weeks.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 24, padding: 80, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>🗂️</p>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>No Weeks Yet</h3>
              <p style={{ color: '#64748b', marginBottom: 24 }}>Create a week, then add a section per course and break each one into subsections and steps.</p>
              <button onClick={openAdd} style={{ background: '#3b82f6', color: '#fff', padding: '12px 28px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                Create First Week
              </button>
            </div>
          ) : (
            <div className="months-grid" style={{ gap: 24 }}>
              {weeks.map((w, i) => (
                <WeekCard
                  key={w._id}
                  week={w}
                  gradient={gradientFor(i)}
                  semesterLabel={semesterLabel(w.semester)}
                  onDelete={handleDelete}
                  onEdit={openEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ───────────────────────────────────── */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(10, 18, 36, 0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
            backdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 32, width: '100%', maxWidth: 480,
            boxShadow: '0 32px 64px rgba(0,0,0,0.5)', overflow: 'hidden',
          }}>
            <div style={{ padding: '32px 40px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(96,165,250,0.8)', marginBottom: 4 }}>
                  {editId ? 'Edit Week' : 'New Week'}
                </p>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>
                  {editId ? 'Modify Week' : 'Setup Weekly Backlog'}
                </h3>
              </div>
              <button onClick={() => setModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <MdClose size={22} />
              </button>
            </div>

            {/* Week number hero */}
            <div style={{ padding: '28px 40px 20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Week Number</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span style={{ fontSize: 30, fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>#</span>
                <input
                  type="number" min="1" autoFocus
                  value={form.weekNumber}
                  onChange={e => setForm(f => ({ ...f, weekNumber: +e.target.value }))}
                  style={{ background: 'transparent', border: 'none', fontSize: 52, fontWeight: 900, color: '#fff', outline: 'none', width: 160, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}
                  placeholder="1"
                />
              </div>
            </div>

            <div style={{ padding: '24px 40px' }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
                Semester
              </label>
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden' }}>
                <select
                  value={form.semester}
                  onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
                  style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', width: '100%', padding: '16px 18px' }}
                >
                  {semesters.map(s => (
                    <option key={s._id} value={s._id} style={{ background: '#1a2f5e' }}>{s.name} {s.year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ padding: '0 40px 36px', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '12px 24px', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', padding: '12px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(99,102,241,0.4)', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving...' : editId ? 'Apply Changes' : 'Create Week'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function WeekCard({ week, gradient, semesterLabel, onDelete, onEdit }) {
  const [hovered, setHovered] = useState(false);
  const { done, total } = week.progress;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const accent = week.isDone ? '#10b981' : '#3b82f6';

  return (
    <Link
      to={`/backlog/${week._id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#ffffff',
        border: hovered ? `2px solid ${accent}4d` : '2px solid transparent',
        borderRadius: 28,
        padding: 32,
        boxShadow: hovered
          ? `0 20px 48px ${accent}26, 0 4px 16px rgba(0,0,0,0.08)`
          : '0 4px 24px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-6px) scale(1.01)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        textDecoration: 'none',
        minHeight: 220,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: week.isDone ? 'linear-gradient(135deg, #065f46 0%, #10b981 100%)' : gradient, borderRadius: '28px 28px 0 0' }} />

      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56,
            background: week.isDone ? 'linear-gradient(135deg, #065f46 0%, #10b981 100%)' : gradient,
            borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
          }}>
            {week.isDone ? <MdCheck size={30} color="#fff" /> : <MdChecklist size={30} color="#fff" />}
          </div>

          {week.isDone ? (
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 14px', borderRadius: 999, background: '#f0fdf4', color: '#10b981', border: '1px solid #dcfce7' }}>
              Complete
            </span>
          ) : week.unfinished > 0 ? (
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 14px', borderRadius: 999, background: '#fffbeb', color: '#f59e0b', border: '1px solid #fef3c7' }}>
              {week.unfinished} pending
            </span>
          ) : null}
        </div>

        <h3 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, color: '#0f172a', marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Week <span style={{ fontVariantNumeric: 'tabular-nums' }}>{week.weekNumber}</span>
        </h3>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94a3b8' }}>
          {semesterLabel || 'Weekly Checklist'}
        </p>
      </div>

      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>Progress</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: total > 0 ? '#0f172a' : '#cbd5e1', fontVariantNumeric: 'tabular-nums', marginBottom: 10 }}>
            {total > 0 ? `${done}/${total} steps` : 'No steps yet'}
          </p>
          <div style={{ background: '#f1f5f9', borderRadius: 999, height: 6, overflow: 'hidden', maxWidth: 220 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: meterColor(pct), borderRadius: 999, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={(e) => onEdit(e, week)}
            title="Edit week"
            style={{ width: 44, height: 44, borderRadius: 14, background: '#fafafa', border: '1px solid #e2e8f0', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}
          >
            <MdEdit size={18} />
          </button>
          <button
            onClick={(e) => onDelete(e, week._id)}
            title="Delete week"
            style={{ width: 44, height: 44, borderRadius: 14, background: hovered ? '#fef2f2' : '#fafafa', border: '1px solid #fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <MdDelete size={20} />
          </button>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: hovered ? accent : '#eff6ff',
            border: `1px solid ${hovered ? accent : '#dbeafe'}`,
            color: hovered ? '#fff' : accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            transform: hovered ? 'translateX(3px)' : 'none',
          }}>
            <MdArrowForward size={22} />
          </div>
        </div>
      </div>
    </Link>
  );
}
