import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { MdAdd, MdDelete, MdEdit, MdArrowBack, MdClose } from 'react-icons/md';
import toast from 'react-hot-toast';
import { getMonthDetails } from '../../api/month.js';
import { addExpense, updateExpense, deleteExpense } from '../../api/expense.js';

const CATEGORIES = {
  Food:          { icon: '🍔', color: '#f97316', bg: '#fff7ed' },
  Transport:     { icon: '🚗', color: '#6366f1', bg: '#eef2ff' },
  Education:     { icon: '📚', color: '#3b82f6', bg: '#eff6ff' },
  Rent:          { icon: '🏠', color: '#ef4444', bg: '#fff5f5' },
  Utilities:     { icon: '💡', color: '#eab308', bg: '#fefce8' },
  Entertainment: { icon: '🎬', color: '#ec4899', bg: '#fdf2f8' },
  Health:        { icon: '🏥', color: '#10b981', bg: '#f0fdf4' },
  Other:         { icon: '📦', color: '#64748b', bg: '#f8fafc' },
};

const MONTHS_INDEX = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function ExpensesPage() {
  const { monthId } = useParams();
  const [month, setMonth] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], title: '', amount: '', category: 'Food', remark: '' });

  const load = async () => {
    try {
      const res = await getMonthDetails(monthId);
      setMonth(res.data);
      setExpenses(res.data.expenses || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (monthId) load(); }, [monthId]);

  const monthlyTotal = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  const groupedData = useMemo(() => {
    const g = {};
    expenses.forEach(e => {
      const d = new Date(e.date).toDateString();
      if (!g[d]) g[d] = { dateStr: e.date, label: d, items: [], total: 0 };
      g[d].items.push(e);
      g[d].total += e.amount;
    });
    return Object.values(g).sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr));
  }, [expenses]);

  const categoryBreakdown = useMemo(() => {
    const c = {};
    expenses.forEach(e => { c[e.category] = (c[e.category] || 0) + e.amount; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [expenses]);

  const openAdd = () => {
    setEditId(null);
    const mIdx = MONTHS_INDEX.indexOf(month?.name);
    const d = new Date(month?.year || 2026, mIdx, Math.min(new Date().getDate(), 28));
    setForm({ date: d.toISOString().split('T')[0], title: '', amount: '', category: 'Food', remark: '' });
    setModal(true);
  };
  const openEdit = (e) => {
    setEditId(e._id);
    setForm({ date: e.date.split('T')[0], title: e.title, amount: e.amount, category: e.category, remark: e.remark || '' });
    setModal(true);
  };
  const handleSave = async () => {
    if (!form.title || !form.amount || !form.date) return toast.error('Fill all required fields');
    setSaving(true);
    try {
      if (editId) await updateExpense(editId, form);
      else await addExpense({ ...form, monthId });
      toast.success(editId ? 'Updated' : 'Logged');
      setModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    try { await deleteExpense(id); toast.success('Removed'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="loading loading-spinner loading-lg text-blue" />
    </div>
  );
  if (!month) return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <p style={{ fontSize: 18, color: '#64748b' }}>Month not found.</p>
      <Link to="/expenses" style={{ color: '#3b82f6', fontWeight: 700 }}>← Back to Records</Link>
    </div>
  );

  const budgetUsedPct = month.budget > 0 ? Math.min(100, Math.round((monthlyTotal / month.budget) * 100)) : 0;
  const budgetColor = budgetUsedPct > 90 ? '#ef4444' : budgetUsedPct > 70 ? '#f59e0b' : '#10b981';

  return (
    <>
      <div style={{ minHeight: '100vh', background: '#f0f4f9' }}>

        {/* ── Hero ─────────────────────────────────────── */}
        <div className="hero-section" style={{
          background: 'linear-gradient(135deg, #0f1e3c 0%, #1a2f5e 60%, #1e3a6e 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Link to="/expenses" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(96,165,250,0.8)', fontSize: 13, fontWeight: 700, marginBottom: 20, textDecoration: 'none' }}>
              <MdArrowBack size={18} /> Back to Monthly Records
            </Link>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.25em', color: 'rgba(96,165,250,0.8)', textTransform: 'uppercase', marginBottom: 10 }}>
              Financial Log • {month.year}
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 6 }}>
                  {month.name} Ledger
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Daily spending records for {month.name} {month.year}</p>
              </div>
              <button
                onClick={openAdd}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#3b82f6', color: '#fff', padding: '14px 28px', borderRadius: 16, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(59,130,246,0.4)' }}
              >
                <MdAdd size={22} /> Add Expense
              </button>
            </div>
          </div>
        </div>

        <div className="content-section" style={{ paddingBottom: 60 }}>
          {/* ── Summary Cards ─────────────────────────── */}
          <div className="stats-grid" style={{ marginBottom: 36 }}>
            <div style={{ background: '#fff', borderRadius: 24, padding: '28px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', borderTop: '4px solid #3b82f6' }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>Monthly Total</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>৳{monthlyTotal.toLocaleString()}</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 24, padding: '28px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', borderTop: '4px solid #10b981' }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>Transactions</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>{expenses.length} <span style={{ fontSize: 16, fontWeight: 500, color: '#94a3b8' }}>records</span></p>
            </div>
            <div style={{ background: '#fff', borderRadius: 24, padding: '28px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', borderTop: `4px solid ${budgetColor}` }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>
                {month.budget > 0 ? 'Budget Remaining' : 'Target Budget'}
              </p>
              {month.budget > 0 ? (
                <>
                  <p style={{ fontSize: 32, fontWeight: 900, color: budgetUsedPct > 90 ? '#ef4444' : '#0f172a', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                    ৳{(month.budget - monthlyTotal).toLocaleString()}
                  </p>
                  <div style={{ marginTop: 10, background: '#f1f5f9', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${budgetUsedPct}%`, background: budgetColor, borderRadius: 999, transition: 'width 0.5s ease' }} />
                  </div>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{budgetUsedPct}% of ৳{month.budget.toLocaleString()} used</p>
                </>
              ) : (
                <p style={{ fontSize: 32, fontWeight: 900, color: '#94a3b8' }}>Not set</p>
              )}
            </div>
          </div>

          {/* ── Expense Log ───────────────────────────── */}
          {expenses.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 28, padding: '80px 40px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 52, marginBottom: 16 }}>✨</p>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Empty Ledger</h3>
              <p style={{ color: '#64748b', marginBottom: 28 }}>Start logging your daily expenses to gain financial insights.</p>
              <button onClick={openAdd} style={{ background: '#3b82f6', color: '#fff', padding: '14px 32px', borderRadius: 14, border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 6px 20px rgba(59,130,246,0.3)' }}>
                Log First Expense
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
              {groupedData.map(group => (
                <div key={group.dateStr}>
                  {/* Day Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 16, background: '#1a2f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                          {new Date(group.dateStr).getDate()}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                          {new Date(group.dateStr).toLocaleDateString([], { weekday: 'long' })}
                        </p>
                        <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                          {new Date(group.dateStr).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', padding: '8px 20px', borderRadius: 14 }}>
                      <p style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>Day Total</p>
                      <p style={{ fontSize: 20, fontWeight: 900, color: '#1a2f5e', fontVariantNumeric: 'tabular-nums' }}>৳{group.total.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Expense Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {group.items.map(item => (
                      <ExpenseRow key={item._id} item={item} onEdit={openEdit} onDelete={handleDelete} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Expense Modal ─────────────────────────────── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,18,36,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 32, width: '100%', maxWidth: 500, boxShadow: '0 32px 64px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '28px 36px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(96,165,250,0.8)', marginBottom: 4 }}>{editId ? 'Edit Entry' : 'New Entry'}</p>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>
                  {editId ? 'Modify Transaction' : 'Log New Expense'}
                </h3>
              </div>
              <button onClick={() => setModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <MdClose size={20} />
              </button>
            </div>

            {/* Amount Hero */}
            <div style={{ padding: '28px 36px 20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Transaction Amount</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>৳</span>
                <input
                  type="number" autoFocus step="0.01"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))}
                  style={{ background: 'transparent', border: 'none', fontSize: 52, fontWeight: 900, color: '#fff', outline: 'none', width: '200px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Fields */}
            <div style={{ padding: '20px 36px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <ModalField label="Category">
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', width: '100%', padding: '14px 16px' }}>
                    {Object.keys(CATEGORIES).map(c => <option key={c} value={c} style={{ background: '#1a2f5e' }}>{c}</option>)}
                  </select>
                </ModalField>
                <ModalField label="Date">
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, outline: 'none', width: '100%', padding: '14px 16px' }} />
                </ModalField>
              </div>
              <div style={{ marginBottom: 14 }}>
                <ModalField label="Description">
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Cafeteria Lunch" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 15, fontWeight: 500, outline: 'none', width: '100%', padding: '14px 16px' }} />
                </ModalField>
              </div>
              <ModalField label="Memo (optional)">
                <input type="text" value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} placeholder="Optional note..." style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 15, fontWeight: 500, outline: 'none', width: '100%', padding: '14px 16px' }} />
              </ModalField>
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 36px 32px', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '12px 22px', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Discard
              </button>
              <button onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', padding: '12px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(99,102,241,0.4)', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : editId ? 'Apply Changes' : 'Confirm Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ModalField({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{label}</label>
      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function ExpenseRow({ item, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const cat = CATEGORIES[item.category] || CATEGORIES.Other;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#fff' : '#fff',
        border: hovered ? '2px solid rgba(59,130,246,0.2)' : '2px solid transparent',
        borderRadius: 22, padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: hovered ? '0 8px 24px rgba(59,130,246,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.25s ease',
        gap: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, border: `1px solid ${cat.color}20` }}>
          {cat.icon}
        </div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{item.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2px 10px', borderRadius: 999, background: cat.bg, color: cat.color }}>
              {item.category}
            </span>
            {item.remark && <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>· {item.remark}</span>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <p style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
          ৳{item.amount.toLocaleString()}
        </p>
        <div style={{ display: 'flex', gap: 8, opacity: hovered ? 1 : 0, transform: hovered ? 'none' : 'translateX(10px)', transition: 'all 0.2s ease' }}>
          <button
            onClick={() => onEdit(item)}
            style={{ width: 40, height: 40, borderRadius: 12, background: '#eff6ff', border: '1px solid #dbeafe', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <MdEdit size={18} />
          </button>
          <button
            onClick={() => onDelete(item._id)}
            style={{ width: 40, height: 40, borderRadius: 12, background: '#fff5f5', border: '1px solid #fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <MdDelete size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
