import { useEffect, useState } from 'react';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import toast from 'react-hot-toast';
import moment from 'moment';
import { getMarks, addMarks, updateMarks, deleteMarks } from '../../../api/marks.js';
import StatCard from '../../../components/UI/StatCard.jsx';
import Modal from '../../../components/UI/Modal.jsx';
import EmptyState from '../../../components/UI/EmptyState.jsx';

const TYPE_OPTS  = ['quiz', 'mid', 'assignment'];
const TYPE_LABELS = { quiz: 'Quiz', mid: 'Mid Exam', assignment: 'Assignment' };
const TYPE_COLORS = { quiz: 'badge-blue', mid: 'badge-navy', assignment: 'badge-amber' };

const EMPTY_FORM = {
  type: 'quiz', title: '', date: moment().format('YYYY-MM-DD'),
  obtainedMarks: '', totalMarks: '', remark: ''
};

function ScoreBar({ obtained, total }) {
  const pct = total > 0 ? Math.round((obtained / total) * 100) : 0;
  const color = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red)';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color, fontWeight: 700 }}>{obtained}/{total}</span>
        <span style={{ color, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function avg(arr) {
  if (!arr.length) return null;
  const pcts = arr.map(r => (r.obtainedMarks / r.totalMarks) * 100);
  return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
}

export default function MarksTab({ courseId }) {
  const [records, setRecords] = useState([]);
  const [tab,     setTab]     = useState('all');
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [editId,  setEditId]  = useState(null);
  const [saving,  setSaving]  = useState(false);

  const load = () => {
    setLoading(true);
    getMarks(courseId).then(r => {
      setRecords(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [courseId]);

  const openAdd  = () => { setForm(EMPTY_FORM); setEditId(null); setModal(true); };
  const openEdit = (r) => {
    setForm({ type: r.type, title: r.title,
      date: r.date ? moment(r.date).format('YYYY-MM-DD') : '',
      obtainedMarks: r.obtainedMarks, totalMarks: r.totalMarks, remark: r.remark });
    setEditId(r._id);
    setModal(true);
  };
  const close = () => { setModal(false); setEditId(null); };

  const handleSave = async () => {
    if (!form.type || !form.title || form.obtainedMarks === '' || !form.totalMarks)
      return toast.error('Required fields: Type, title, obtained/total marks');
    setSaving(true);
    const payload = { ...form, obtainedMarks: Number(form.obtainedMarks), totalMarks: Number(form.totalMarks) };
    try {
      if (editId) { await updateMarks(editId, payload); toast.success('Updated'); }
      else { await addMarks(courseId, payload); toast.success('Added'); }
      close();
      getMarks(courseId).then(r => setRecords(r.data));
    } catch (e) { toast.error(e?.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return;
    try { await deleteMarks(id); toast.success('Deleted'); setRecords(rs => rs.filter(r => r._id !== id)); }
    catch { toast.error('Failed'); }
  };

  const filtered = tab === 'all' ? records : records.filter(r => r.type === tab);
  const quizzes  = records.filter(r => r.type === 'quiz');
  const mids     = records.filter(r => r.type === 'mid');
  const assigns  = records.filter(r => r.type === 'assignment');

  return (
    <div className="tab-pane-content">
      {/* Summary stats */}
      <div className="stats-grid anim-fade-up delay-1">
        <StatCard label="Total Records"  value={records.length} accentColor="var(--navy)" />
        <StatCard label="Quiz Avg"       value={avg(quizzes) !== null ? `${avg(quizzes)}%` : '—'} accentColor="var(--blue)" />
        <StatCard label="Mid Score"      value={mids.length > 0 ? `${mids[0].obtainedMarks}/${mids[0].totalMarks}` : '—'} accentColor="var(--navy)" />
        <StatCard label="Assignment Avg" value={avg(assigns) !== null ? `${avg(assigns)}%` : '—'} accentColor="var(--amber)" />
      </div>

      <div className="tab-bar anim-fade-up delay-2">
        {['all', 'quiz', 'mid', 'assignment'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}>
            {t === 'all' ? 'All' : TYPE_LABELS[t]}
            <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.6 }}>
              ({t === 'all' ? records.length : records.filter(r => r.type === t).length})
            </span>
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-6 anim-fade-up delay-3">
        <h3 className="section-title">Academic Scores</h3>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <MdAdd size={16} /> Add Record
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📊" title="No records"
          description={tab === 'all' ? "Start tracking masks for this course." : `No ${TYPE_LABELS[tab]} records found.`}
          action={<button className="btn btn-primary" onClick={openAdd}><MdAdd size={15} /> Add Record</button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((rec, i) => (
            <div key={rec._id} className="card card-blue-border anim-fade-up"
              style={{ borderLeftColor: rec.type === 'mid' ? 'var(--navy)' : rec.type === 'assignment' ? 'var(--amber)' : 'var(--blue)' }}>
              <div className="card-body">
                <div className="flex items-start justify-between gap-3">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${TYPE_COLORS[rec.type]}`}>{TYPE_LABELS[rec.type]}</span>
                      {rec.date && (
                        <span className="text-xs text-muted">{moment(rec.date).format('DD MMM YYYY')}</span>
                      )}
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
                      {rec.title}
                    </h3>
                    <ScoreBar obtained={rec.obtainedMarks} total={rec.totalMarks} />
                    {rec.remark && (
                      <p className="text-xs text-muted mt-2">{rec.remark}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-icon" onClick={() => openEdit(rec)}><MdEdit size={15}/></button>
                    <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(rec._id)}
                      style={{ color: 'var(--red)' }}><MdDelete size={15}/></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={editId ? 'Edit Marks Record' : 'Add Marks Record'}
          onClose={close}
          footer={<>
            <button className="btn btn-outline" onClick={close}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select"
                value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPE_OPTS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input"
                value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" placeholder="e.g. Quiz 1, Mid Term…"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Obtained Marks</label>
              <input type="number" className="form-input" min={0}
                value={form.obtainedMarks} onChange={e => setForm(f => ({ ...f, obtainedMarks: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Total Marks</label>
              <input type="number" className="form-input" min={1}
                value={form.totalMarks} onChange={e => setForm(f => ({ ...f, totalMarks: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Remark (Optional)</label>
            <textarea className="form-textarea" placeholder="Any notes…"
              value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} />
          </div>
        </Modal>
      )}
    </div>
  );
}
