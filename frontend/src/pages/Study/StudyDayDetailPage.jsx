import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import {
  MdArrowBack, MdAdd, MdDelete, MdEdit, MdClose, MdTimer,
  MdCheck, MdSchedule, MdStar, MdTrendingUp, MdInfo
} from 'react-icons/md';


import toast from 'react-hot-toast';
import {
  getStudyDay,
  createSession, updateSession, deleteSession,
  createOrUpdateOverview, deleteOverview
} from '../../api/study.js';

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

// Parse "HH:MM" to minutes since midnight
const toMin = t => { const [h,m] = t.split(':').map(Number); return h * 60 + m; };
const durHours = (s, e) => Math.round((toMin(e) - toMin(s)) / 60);
const formatTime = t => { if (!t) return ''; const [h,m] = t.split(':').map(Number); const ampm = h >= 12 ? 'PM' : 'AM'; return `${((h % 12) || 12)}:${String(m).padStart(2,'0')} ${ampm}`; };

function RatingBadge({ rating }) {
  const color = rating >= 8 ? '#22c55e' : rating >= 5 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: color + '20', border: `1px solid ${color}40`, borderRadius: 50, padding: '5px 14px' }}>
      <MdStar size={15} color={color} />
      <span style={{ fontSize: 16, fontWeight: 900, color }}>{rating}</span>
      <span style={{ fontSize: 12, color, opacity: 0.7 }}>/ 10</span>
    </div>
  );
}

export default function StudyDayDetailPage() {
  const { dayId } = useParams();
  const [day, setDay] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Session modal state
  const [sessionModal, setSessionModal] = useState(false);
  const [editSessionId, setEditSessionId] = useState(null);
  const [sessionForm, setSessionForm] = useState({ startTime: '08:00', endTime: '10:00' });
  const [hourBlocks, setHourBlocks] = useState([]);
  const [savingSession, setSavingSession] = useState(false);

  // Overview modal state
  const [overviewModal, setOverviewModal] = useState(false);
  const [overviewForm, setOverviewForm] = useState({ rating: 7, reflection: '', improveZone: '' });
  const [savingOverview, setSavingOverview] = useState(false);

  const load = async () => {
    try {
      const res = await getStudyDay(dayId);
      setDay(res.data);
      setSessions(res.data.sessions || []);
      setOverview(res.data.overview || null);
    } catch { toast.error('Failed to load day details'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (dayId) load(); }, [dayId]);

  // When times change in session form, regenerate hour block stubs
  useEffect(() => {
    const { startTime, endTime } = sessionForm;
    if (!startTime || !endTime) return;
    const dur = durHours(startTime, endTime);
    if (dur >= 1 && dur <= 4) {
      setHourBlocks(prev => Array.from({ length: dur }, (_, i) => ({
        blockIndex: i,
        topic: prev[i]?.topic ?? '',
        wasted: prev[i]?.wasted ?? false,
        note: prev[i]?.note ?? '',
      })));
    }
  }, [sessionForm.startTime, sessionForm.endTime]);

  const stats = useMemo(() => {
    const totalHours = sessions.reduce((s, sess) => s + sess.durationHours, 0);
    const wastedHours = sessions.reduce((s, sess) => s + sess.hourBlocks.filter(b => b.wasted).length, 0);
    const productiveHours = totalHours - wastedHours;
    return { totalHours, wastedHours, productiveHours };
  }, [sessions]);

  // ── Session handlers ─────────────────────────────────────
  const openAddSession = () => {
    setEditSessionId(null);
    setSessionForm({ startTime: '08:00', endTime: '10:00' });
    setHourBlocks([]);
    setSessionModal(true);
  };

  const openEditSession = (sess) => {
    setEditSessionId(sess._id);
    setSessionForm({ startTime: sess.startTime, endTime: sess.endTime });
    setHourBlocks(sess.hourBlocks.map(b => ({ ...b })));
    setSessionModal(true);
  };

  const handleSaveSession = async () => {
    const { startTime, endTime } = sessionForm;
    const dur = durHours(startTime, endTime);
    if (dur < 1 || dur > 4) return toast.error('Session must be 1–4 hours');
    if (toMin(endTime) <= toMin(startTime)) return toast.error('End time must be after start time');
    setSavingSession(true);
    try {
      if (editSessionId) {
        await updateSession(editSessionId, { startTime, endTime, hourBlocks });
        toast.success('Session updated');
      } else {
        await createSession(dayId, { startTime, endTime, hourBlocks });
        toast.success('Session logged');
      }
      setSessionModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingSession(false); }
  };

  const handleDeleteSession = async (id) => {
    if (!confirm('Delete this session?')) return;
    try { await deleteSession(id); toast.success('Session removed'); load(); }
    catch { toast.error('Failed'); }
  };

  // ── Overview handlers ────────────────────────────────────
  const openOverviewModal = () => {
    setOverviewForm({
      rating: overview?.rating ?? 7,
      reflection: overview?.reflection ?? '',
      improveZone: overview?.improveZone ?? '',
    });
    setOverviewModal(true);
  };

  const handleSaveOverview = async () => {
    if (!overviewForm.rating) return toast.error('Rating is required');
    setSavingOverview(true);
    try {
      await createOrUpdateOverview(dayId, overviewForm);
      toast.success(overview ? 'Overview updated' : 'Overview saved');
      setOverviewModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingOverview(false); }
  };

  const handleDeleteOverview = async () => {
    if (!confirm('Remove day overview?')) return;
    try { await deleteOverview(dayId); toast.success('Overview removed'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f4f9' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#64748b', fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  );

  if (!day) return null;

  const dateLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Duration validation helper for display
  const dur = durHours(sessionForm.startTime, sessionForm.endTime);
  const durValid = dur >= 1 && dur <= 4 && toMin(sessionForm.endTime) > toMin(sessionForm.startTime);

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f9' }}>

      {/* ── Hero Header ──────────────────────────────── */}
      <div className="hero-section" style={{
        background: 'linear-gradient(135deg, #0f1e3c 0%, #1a2f5e 60%, #1e3a6e 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/study" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
            <MdArrowBack size={16} /> Back to Study Log
          </Link>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.25em', color: 'rgba(96,165,250,0.9)', textTransform: 'uppercase', marginBottom: 10 }}>
            Daily Study Record
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 900, color: '#fff', margin: 0 }}>
                {dateLabel}
              </h1>
              {overview && <div style={{ marginTop: 10 }}><RatingBadge rating={overview.rating} /></div>}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={openOverviewModal}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: overview ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '12px 20px', borderRadius: 16, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                <MdStar size={17} /> {overview ? 'Edit Overview' : 'Add Overview'}
              </button>
              <button
                onClick={openAddSession}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', padding: '12px 20px', borderRadius: 16, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(59,130,246,0.4)' }}
              >
                <MdAdd size={18} /> Add Session
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="stats-grid" style={{ marginTop: 32 }}>
            {[
              { label: 'Total Hours', value: stats.totalHours + 'h', icon: <MdTimer size={22} color="rgba(96,165,250,0.8)" /> },
              { label: 'Productive Hours', value: stats.productiveHours + 'h', icon: <MdTrendingUp size={22} color="rgba(34,197,94,0.8)" /> },
              { label: 'Hours Wasted', value: stats.wastedHours + 'h', icon: <MdInfo size={22} color="rgba(239,68,68,0.8)" /> },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '18px 22px', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 16 }}>
                {s.icon}
                <div>
                  <p style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '3px 0 0' }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────── */}
      <div className="content-section" style={{ marginTop: -32, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── Day Overview Panel ───────────────────── */}
        {overview && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>Day Overview</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={openOverviewModal} style={{ background: '#eff6ff', border: 'none', borderRadius: 10, padding: '7px 12px', color: '#3b82f6', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                  Edit
                </button>
                <button onClick={handleDeleteOverview} style={{ background: '#fff5f5', border: 'none', borderRadius: 10, padding: '7px 12px', color: '#ef4444', cursor: 'pointer' }}>
                  <MdDelete size={15} />
                </button>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'stretch' }}>
              {/* Rating */}
              <div style={{ padding: '24px', borderRight: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'linear-gradient(135deg, #1a2f5e, #3b82f6)', borderRadius: 16, padding: 14 }}>
                  <MdStar size={24} color="#fbbf24" />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', margin: '0 0 4px' }}>Day Rating</p>
                  <RatingBadge rating={overview.rating} />
                </div>
              </div>

              {/* Reflection */}
              <div style={{ padding: '20px 24px', borderRight: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10 }}>📝 Reflection</p>
                <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, margin: 0 }}>
                  {overview.reflection || <span style={{ color: '#94a3b8' }}>No reflection written.</span>}
                </p>
              </div>

              {/* Improve Zone */}
              <div style={{ padding: '20px 24px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10 }}>🚀 Improve Zone</p>
                <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, margin: 0 }}>
                  {overview.improveZone || <span style={{ color: '#94a3b8' }}>No improvement notes.</span>}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Study Sessions ───────────────────────── */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 20 }}>
            Study Sessions
            <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 600, color: '#64748b' }}>({sessions.length})</span>
          </h2>

          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏱️</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>No Sessions Yet</h3>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Add your first study session to track your progress.</p>
              <button onClick={openAddSession} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', padding: '11px 24px', borderRadius: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Add Session
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {sessions.map((sess, si) => (
                <div key={sess._id} style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  {/* Session header */}
                  <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1e3a6e, #1a2f5e)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 14px' }}>
                        <MdSchedule size={20} color="#93c5fd" />
                      </div>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', margin: '0 0 2px', textTransform: 'uppercase' }}>Session {si + 1}</p>
                        <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>
                          {formatTime(sess.startTime)} → {formatTime(sess.endTime)}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ background: 'rgba(59,130,246,0.3)', borderRadius: 10, padding: '5px 14px' }}>
                        <span style={{ color: '#93c5fd', fontWeight: 700, fontSize: 14 }}>{sess.durationHours}h</span>
                      </div>
                      <button onClick={() => openEditSession(sess)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, padding: '7px 12px', color: '#fff', cursor: 'pointer' }}>
                        <MdEdit size={16} />
                      </button>
                      <button onClick={() => handleDeleteSession(sess._id)} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: 10, padding: '7px 12px', color: '#fca5a5', cursor: 'pointer' }}>
                        <MdDelete size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Hour blocks */}
                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {sess.hourBlocks.map((block, bi) => {
                      const blockStart = (() => {
                        const [h,m] = sess.startTime.split(':').map(Number);
                        const total = h * 60 + m + bi * 60;
                        return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
                      })();
                      const blockEnd = (() => {
                        const [h,m] = sess.startTime.split(':').map(Number);
                        const total = h * 60 + m + (bi + 1) * 60;
                        return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
                      })();

                      return (
                        <div key={bi} style={{
                          display: 'flex', gap: 14, alignItems: 'flex-start',
                          background: block.wasted ? '#fff5f5' : '#f8faff',
                          border: `1px solid ${block.wasted ? '#fecaca' : '#e2e8f0'}`,
                          borderRadius: 16, padding: '14px 18px',
                        }}>
                          <div style={{
                            minWidth: 40, height: 40, borderRadius: 12,
                            background: block.wasted ? '#fee2e2' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 15, fontWeight: 900,
                            color: block.wasted ? '#ef4444' : '#fff',
                          }}>
                            {block.wasted ? '💤' : (bi + 1)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                                {formatTime(blockStart)} – {formatTime(blockEnd)}
                              </span>
                              {block.wasted && (
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', background: '#fee2e2', padding: '2px 8px', borderRadius: 6 }}>
                                  WASTED
                                </span>
                              )}
                            </div>
                            {!block.wasted && (
                              <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '2px 0' }}>
                                {block.topic || <span style={{ color: '#94a3b8' }}>No topic set</span>}
                              </p>
                            )}
                            {block.note && <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>{block.note}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ Session Modal ════════════════════════════════════════ */}
      {sessionModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,18,36,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 32, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>

            {/* Header */}
            <div style={{ padding: '28px 32px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(96,165,250,0.8)', marginBottom: 4 }}>{editSessionId ? 'Edit Session' : 'New Session'}</p>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>{editSessionId ? 'Update Study Session' : 'Log Study Session'}</h3>
              </div>
              <button onClick={() => setSessionModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <MdClose size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1 }}>
              {/* Time selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                {[['startTime', 'Start Time'], ['endTime', 'End Time']].map(([key, label]) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>{label}</label>
                    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, overflow: 'hidden' }}>
                      <input
                        type="time"
                        value={sessionForm[key]}
                        onChange={e => setSessionForm(f => ({ ...f, [key]: e.target.value }))}
                        style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px 20px', color: '#fff', fontSize: 16, fontWeight: 600, outline: 'none', colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Duration indicator */}
              {durValid ? (
                <div style={{ marginBottom: 24, padding: '12px 16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MdTimer size={18} color="#93c5fd" />
                  <span style={{ color: '#93c5fd', fontWeight: 700, fontSize: 14 }}>{dur} hour{dur > 1 ? 's' : ''} session → {dur} hour block{dur > 1 ? 's' : ''}</span>
                </div>
              ) : sessionForm.startTime && sessionForm.endTime && (
                <div style={{ marginBottom: 24, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14 }}>
                  <span style={{ color: '#fca5a5', fontWeight: 600, fontSize: 14 }}>⚠️ Session must be 1–4 hours. End must be after start.</span>
                </div>
              )}

              {/* Hour blocks */}
              {durValid && hourBlocks.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>Hour Blocks</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {hourBlocks.map((block, i) => {
                      const bStart = (() => { const [h,m] = sessionForm.startTime.split(':').map(Number); const t = h*60+m+i*60; return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`; })();
                      const bEnd = (() => { const [h,m] = sessionForm.startTime.split(':').map(Number); const t = h*60+m+(i+1)*60; return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`; })();

                      const updateBlock = (field, val) => setHourBlocks(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: val } : b));

                      return (
                        <div key={i} style={{ background: block.wasted ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${block.wasted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 20, padding: '18px 20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 28, height: 28, borderRadius: 8, background: block.wasted ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
                                {i + 1}
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{formatTime(bStart)} – {formatTime(bEnd)}</span>
                            </div>
                            {/* Wasted toggle */}
                            <div
                              onClick={() => updateBlock('wasted', !block.wasted)}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, background: block.wasted ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${block.wasted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 20, padding: '6px 14px', cursor: 'pointer' }}
                            >
                              <div style={{ width: 16, height: 16, borderRadius: 4, background: block.wasted ? '#ef4444' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {block.wasted && <MdCheck size={12} color="#fff" />}
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: block.wasted ? '#fca5a5' : 'rgba(255,255,255,0.4)' }}>Hour Wasted</span>
                            </div>
                          </div>
                          {!block.wasted && (
                            <>
                              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, marginBottom: 10 }}>
                                <input
                                  className="glass-input"
                                  style={{ fontSize: 14, padding: '12px 16px', width: '100%', boxSizing: 'border-box' }}
                                  placeholder="What did you study this hour?"
                                  value={block.topic}
                                  onChange={e => updateBlock('topic', e.target.value)}
                                />
                              </div>
                              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }}>
                                <input
                                  className="glass-input"
                                  style={{ fontSize: 14, padding: '12px 16px', width: '100%', boxSizing: 'border-box' }}
                                  placeholder="Optional note..."
                                  value={block.note}
                                  onChange={e => updateBlock('note', e.target.value)}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 32px 28px', display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setSessionModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '11px 22px', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveSession} disabled={savingSession || !durValid} style={{ background: durValid ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(255,255,255,0.1)', color: '#fff', padding: '11px 26px', borderRadius: 14, fontSize: 14, fontWeight: 700, border: 'none', cursor: durValid ? 'pointer' : 'not-allowed', opacity: savingSession ? 0.7 : 1 }}>
                {savingSession ? 'Saving...' : editSessionId ? 'Update Session' : 'Log Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Overview Modal ══════════════════════════════════════ */}
      {overviewModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,18,36,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 32, width: '100%', maxWidth: 520, boxShadow: '0 32px 64px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '28px 32px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(96,165,250,0.8)', marginBottom: 4 }}>Daily Reflection</p>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>{overview ? 'Edit Day Overview' : 'Add Day Overview'}</h3>
              </div>
              <button onClick={() => setOverviewModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <MdClose size={20} />
              </button>
            </div>

            <div style={{ padding: '24px 32px 28px' }}>
              {/* Rating */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                  Day Rating (1–10)
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => {
                    const selected = overviewForm.rating === n;
                    const color = n >= 8 ? '#22c55e' : n >= 5 ? '#f59e0b' : '#ef4444';
                    return (
                      <button
                        key={n}
                        onClick={() => setOverviewForm(f => ({ ...f, rating: n }))}
                        style={{ width: 38, height: 38, borderRadius: 10, border: `2px solid ${selected ? color : 'rgba(255,255,255,0.1)'}`, background: selected ? color + '30' : 'rgba(255,255,255,0.05)', color: selected ? color : 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s' }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reflection */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>📝 Reflection</label>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18 }}>
                  <textarea
                    className="glass-input"
                    style={{ fontSize: 14, padding: '14px 18px', minHeight: 100, resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                    placeholder="What went well today? What did you accomplish?"
                    value={overviewForm.reflection}
                    onChange={e => setOverviewForm(f => ({ ...f, reflection: e.target.value }))}
                  />
                </div>
              </div>

              {/* Improve Zone */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>🚀 Improve Zone</label>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18 }}>
                  <textarea
                    className="glass-input"
                    style={{ fontSize: 14, padding: '14px 18px', minHeight: 100, resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                    placeholder="What could you improve? Where did you fall short?"
                    value={overviewForm.improveZone}
                    onChange={e => setOverviewForm(f => ({ ...f, improveZone: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button onClick={() => setOverviewModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '11px 22px', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSaveOverview} disabled={savingOverview} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', padding: '11px 26px', borderRadius: 14, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: savingOverview ? 0.7 : 1 }}>
                  {savingOverview ? 'Saving...' : overview ? 'Update Overview' : 'Save Overview'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
