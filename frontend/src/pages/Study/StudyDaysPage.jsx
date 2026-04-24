import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router';
import { MdAdd, MdDelete, MdClose, MdCalendarToday, MdArrowForward, MdMenuBook, MdStar, MdTimer } from 'react-icons/md';
import toast from 'react-hot-toast';
import { getStudyDays, createStudyDay, deleteStudyDay } from '../../api/study.js';

const DAY_GRADIENTS = [
  'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #415a77 100%)',
  'linear-gradient(135deg, #1b0030 0%, #270056 50%, #3d00a8 100%)',
  'linear-gradient(135deg, #0b3d0b 0%, #167a16 50%, #1e9e1e 100%)',
  'linear-gradient(135deg, #3d0000 0%, #7b1010 50%, #a82020 100%)',
];

function ratingColor(r) {
  if (!r) return 'rgba(255,255,255,0.25)';
  if (r >= 8) return '#22c55e';
  if (r >= 5) return '#f59e0b';
  return '#ef4444';
}

export default function StudyDaysPage() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const load = async () => {
    try {
      const res = await getStudyDays();
      setDays(res.data);
    } catch { toast.error('Failed to load study days'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const totalDays = days.length;
    const rated = days.filter(d => d.overview?.rating);
    const avgRating = rated.length
      ? (rated.reduce((s, d) => s + d.overview.rating, 0) / rated.length).toFixed(1)
      : '—';
    const thisWeek = days.filter(d => {
      const diff = (Date.now() - new Date(d.date)) / (1000 * 60 * 60 * 24);
      return diff < 7;
    }).length;
    return { totalDays, avgRating, thisWeek };
  }, [days]);

  const handleCreate = async () => {
    if (!date) return toast.error('Select a date');
    setSaving(true);
    try {
      await createStudyDay({ date });
      toast.success('Study day created');
      setModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm('Delete this study day and ALL its sessions?')) return;
    try { await deleteStudyDay(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f4f9' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#64748b', fontSize: 14 }}>Loading study log...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f9' }}>

      {/* ── Hero Header ─────────────────────────────── */}
      <div className="hero-section" style={{
        background: 'linear-gradient(135deg, #0f1e3c 0%, #1a2f5e 60%, #1e3a6e 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative dots */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.25em', color: 'rgba(96,165,250,0.9)', textTransform: 'uppercase', marginBottom: 12 }}>
            Study Intelligence
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1 }}>
                Study Management
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 8, fontSize: 15 }}>
                Track your daily sessions, hourly progress, and day reflections.
              </p>
            </div>
            <button
              onClick={() => setModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', padding: '14px 24px', borderRadius: 18, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(59,130,246,0.4)', transition: 'all 0.2s' }}
            >
              <MdAdd size={20} /> Log New Day
            </button>
          </div>

          {/* ── Stats Bar ─────────────────────────────── */}
          <div className="stats-grid" style={{ marginTop: 36 }}>
            {[
              { label: 'Total Days Logged', value: stats.totalDays, icon: '📅' },
              { label: 'Days This Week', value: stats.thisWeek, icon: '🔥' },
              { label: 'Avg Day Rating', value: stats.avgRating, icon: '⭐' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20,
                padding: '20px 24px',
                backdropFilter: 'blur(12px)',
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0 }}>{s.value}</p>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Days Grid ──────────────────────────────── */}
      <div className="content-section" style={{ marginTop: -40, position: 'relative', zIndex: 1 }}>

        {days.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📖</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>No Study Days Yet</h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Click "Log New Day" to start tracking your study sessions.</p>
            <button onClick={() => setModal(true)} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', padding: '12px 28px', borderRadius: 16, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
              Log New Day
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {days.map((day, i) => {
              const d = new Date(day.date);
              const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
              const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              const rating = day.overview?.rating;
              const sessionCount = day.sessionCount ?? 0;

              return (
                <Link key={day._id} to={`/study/${day._id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: DAY_GRADIENTS[i % DAY_GRADIENTS.length],
                    borderRadius: 28,
                    padding: '28px 28px 24px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                    cursor: 'pointer',
                    minHeight: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {/* Decorative circle */}
                    <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', top: 20, right: -20, width: 80, height: 80, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />

                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
                          {dayName}
                        </p>
                        <h3 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>{dateStr}</h3>
                      </div>
                      {rating && (
                        <div style={{
                          background: ratingColor(rating),
                          borderRadius: 50,
                          padding: '6px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          <MdStar size={14} color="#fff" />
                          <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{rating}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MdTimer size={16} color="rgba(255,255,255,0.5)" />
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                            {sessionCount} session{sessionCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {day.overview && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MdMenuBook size={14} color="rgba(255,255,255,0.5)" />
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Overview</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          onClick={(e) => handleDelete(e, day._id)}
                          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.8)', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}
                        >
                          🗑
                        </button>
                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Open</span>
                          <MdArrowForward size={15} color="#fff" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal: Add New Day ────────────────────── */}
      {modal && (
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
            borderRadius: 32, width: '100%', maxWidth: 420,
            boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{ padding: '28px 32px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(96,165,250,0.8)', marginBottom: 4 }}>New Entry</p>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Log Study Day</h3>
              </div>
              <button onClick={() => setModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <MdClose size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 32px 28px' }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                  Date
                </label>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, overflow: 'hidden' }}>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', padding: '16px 20px', color: '#fff', fontSize: 16, fontWeight: 600, outline: 'none', colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button onClick={() => setModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '11px 22px', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', padding: '11px 26px', borderRadius: 14, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(99,102,241,0.4)', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Creating...' : 'Create Day'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
