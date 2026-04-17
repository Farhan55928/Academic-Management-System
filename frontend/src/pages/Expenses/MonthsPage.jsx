import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router';
import { MdAdd, MdCalendarMonth, MdArrowForward, MdDelete, MdClose, MdEdit, MdCheck } from 'react-icons/md';
import toast from 'react-hot-toast';
import { getMonths, createMonth, deleteMonth, updateMonth } from '../../api/month.js';
import EmptyState from '../../components/UI/EmptyState.jsx';

const MONTHS_LIST = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const MONTH_GRADIENTS = [
  'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)',
  'linear-gradient(135deg, #312e81 0%, #6366f1 100%)',
  'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
  'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
  'linear-gradient(135deg, #581c87 0%, #a855f7 100%)',
  'linear-gradient(135deg, #1e3a5f 0%, #06b6d4 100%)',
];

export default function MonthsPage() {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: MONTHS_LIST[new Date().getMonth()],
    year: new Date().getFullYear(),
    budget: 0
  });

  const load = async () => {
    try {
      const res = await getMonths();
      setMonths(res.data);
    } catch { toast.error('Failed to load periods'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const totalBudget = useMemo(() => months.reduce((s, m) => s + Number(m.budget || 0), 0), [months]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createMonth(form);
      toast.success('Period created');
      setModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm('Delete this month and all its expenses?')) return;
    try { await deleteMonth(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <>
      <div style={{ minHeight: '100vh', background: '#f0f4f9' }}>

        {/* ── Hero Header ─────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f1e3c 0%, #1a2f5e 60%, #1e3a6e 100%)',
          padding: '48px 48px 80px',
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
              Financial Intelligence
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
              <div>
                <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 48, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8 }}>
                  Monthly Records
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, fontWeight: 400 }}>
                  Manage and track your academic financial periods
                </p>
              </div>
              <button
                onClick={() => setModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#3b82f6', color: '#fff',
                  padding: '14px 28px', borderRadius: 16, border: 'none',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(59,130,246,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.4)'; }}
              >
                <MdAdd size={22} /> Add New Month
              </button>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'flex', gap: 24, marginTop: 40, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Budget', value: `৳${totalBudget.toLocaleString()}`, color: '#60a5fa' },
                { label: 'Active Periods', value: `${months.length}`, color: '#34d399' },
                { label: 'Avg. Monthly', value: months.length ? `৳${Math.round(totalBudget / months.length).toLocaleString()}` : '৳0', color: '#a78bfa' },
              ].map(stat => (
                <div key={stat.label} style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '20px 32px' }}>
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{stat.label}</p>
                  <p style={{ fontSize: 30, fontWeight: 900, color: stat.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Month Cards ─────────────────────────────── */}
        <div style={{ padding: '0 48px 48px', marginTop: -36 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <div className="loading loading-spinner loading-lg text-blue" />
            </div>
          ) : months.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 24, padding: 80, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>📅</p>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>No Financial Periods</h3>
              <p style={{ color: '#64748b', marginBottom: 24 }}>Create your first month to start tracking daily expenses.</p>
              <button onClick={() => setModal(true)} style={{ background: '#3b82f6', color: '#fff', padding: '12px 28px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                Create First Month
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
              {months.map((m, i) => (
                <MonthCard
                  key={m._id}
                  month={m}
                  gradient={MONTH_GRADIENTS[i % MONTH_GRADIENTS.length]}
                  onDelete={handleDelete}
                  onBudgetUpdate={load}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ─────────────────────────────────────── */}
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
            borderRadius: 32, width: '100%', maxWidth: 480,
            boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{ padding: '32px 40px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(96,165,250,0.8)', marginBottom: 4 }}>New Period</p>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Setup Financial Period</h3>
              </div>
              <button onClick={() => setModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}>
                <MdClose size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '28px 40px' }}>
              {[
                { label: 'Month', type: 'select', key: 'name', options: MONTHS_LIST },
                { label: 'Academic Year', type: 'number', key: 'year', placeholder: '2026' },
                { label: 'Monthly Budget (BDT)', type: 'number', key: 'budget', placeholder: '0.00', prefix: '৳' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                    {field.label}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                    {field.prefix && <span style={{ paddingLeft: 20, fontSize: 22, fontWeight: 900, color: 'rgba(255,255,255,0.35)' }}>{field.prefix}</span>}
                    {field.type === 'select' ? (
                      <select
                        value={form[field.key]}
                        onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        style={{ flex: 1, background: 'transparent', border: 'none', padding: '18px 20px', color: '#fff', fontSize: 18, fontWeight: 600, outline: 'none' }}
                      >
                        {field.options.map(o => <option key={o} value={o} style={{ background: '#1a2f5e' }}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={form[field.key] || ''}
                        placeholder={field.placeholder}
                        onChange={e => setForm(f => ({ ...f, [field.key]: field.type === 'number' ? +e.target.value : e.target.value }))}
                        style={{ flex: 1, background: 'transparent', border: 'none', padding: '18px 20px', color: '#fff', fontSize: 18, fontWeight: 600, outline: 'none' }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '0 40px 36px', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '12px 24px', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', padding: '12px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(99,102,241,0.4)', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Creating...' : 'Initialize Period'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MonthCard({ month, gradient, onDelete, onBudgetUpdate }) {
  const [hovered, setHovered] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(month.budget || '');
  const [saving, setSaving] = useState(false);

  const handleBudgetSave = async (e) => {
    e.preventDefault(); e.stopPropagation();
    setSaving(true);
    try {
      await updateMonth(month._id, { budget: Number(budgetInput) });
      toast.success('Budget updated');
      setEditingBudget(false);
      onBudgetUpdate();
    } catch { toast.error('Failed to update budget'); }
    finally { setSaving(false); }
  };

  return (
    <Link
      to={`/expenses/${month._id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        background: hovered ? 'rgba(255,255,255,0.98)' : '#ffffff',
        border: hovered ? '2px solid rgba(59,130,246,0.3)' : '2px solid transparent',
        borderRadius: 28,
        padding: 32,
        boxShadow: hovered
          ? '0 20px 48px rgba(59,130,246,0.15), 0 4px 16px rgba(0,0,0,0.08)'
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
      {/* Decorative top stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: gradient, borderRadius: '28px 28px 0 0' }} />

      <div>
        {/* Icon Badge */}
        <div style={{
          width: 56, height: 56,
          background: gradient,
          borderRadius: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
          boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
        }}>
          <MdCalendarMonth size={30} color="#fff" />
        </div>

        <h3 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, color: '#0f172a', marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {month.name}{' '}
          <span style={{ fontWeight: 400, color: '#94a3b8' }}>{month.year}</span>
        </h3>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94a3b8' }}>
          Daily Financial Log
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
        <div style={{ flex: 1, marginRight: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>Target Budget</p>
          {editingBudget ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.preventDefault()}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#64748b' }}>৳</span>
              <input
                autoFocus
                type="number"
                value={budgetInput}
                onChange={e => setBudgetInput(e.target.value)}
                onClick={e => e.preventDefault()}
                style={{ flex: 1, border: '2px solid #3b82f6', borderRadius: 10, padding: '6px 10px', fontSize: 16, fontWeight: 700, color: '#0f172a', outline: 'none', width: 90 }}
              />
              <button
                onClick={handleBudgetSave}
                disabled={saving}
                style={{ width: 36, height: 36, borderRadius: 10, background: '#3b82f6', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <MdCheck size={18} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: month.budget > 0 ? '#0f172a' : '#cbd5e1', fontVariantNumeric: 'tabular-nums' }}>
                {month.budget > 0 ? `৳${Number(month.budget).toLocaleString()}` : 'Not set'}
              </p>
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); setEditingBudget(true); setBudgetInput(month.budget || ''); }}
                style={{ width: 28, height: 28, borderRadius: 8, background: 'transparent', border: '1px solid #e2e8f0', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}
              >
                <MdEdit size={14} />
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={(e) => onDelete(e, month._id)}
            style={{
              width: 44, height: 44, borderRadius: 14,
              background: hovered ? '#fef2f2' : '#fafafa',
              border: '1px solid #fee2e2',
              color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <MdDelete size={20} />
          </button>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: hovered ? '#3b82f6' : '#eff6ff',
            border: `1px solid ${hovered ? '#3b82f6' : '#dbeafe'}`,
            color: hovered ? '#fff' : '#3b82f6',
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