import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { MdAdd, MdEdit, MdDelete, MdArrowBack } from 'react-icons/md';
import toast from 'react-hot-toast';
import moment from 'moment';
import { getMarks, addMarks, updateMarks, deleteMarks } from '../../api/marks.js';
import { getSemesters } from '../../api/semesters.js';
import { getCourses } from '../../api/courses.js';
import PageHeader from '../../components/UI/PageHeader.jsx';
import Modal from '../../components/UI/Modal.jsx';
import EmptyState from '../../components/UI/EmptyState.jsx';

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

function avg(arr, key, total) {
  if (!arr.length) return null;
  const pcts = arr.map(r => (r[key] / r.totalMarks) * 100);
  return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
}

export default function MarksPage() {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  const [course,  setCourse]  = useState(null);
  const [records, setRecords] = useState([]);
  const [tab,     setTab]     = useState('all');
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [editId,  setEditId]  = useState(null);
  const [saving,  setSaving]  = useState(false);

  const loadCourse = async () => {
    const res = await getSemesters();
    for (const sem of res.data) {
      const r = await getCourses(sem._id);
      const c = r.data.find(c => c._id === courseId);
      if (c) { setCourse(c); return; }
    }
  };

  useEffect(() => {
    Promise.all([
      getMarks(courseId).then(r => setRecords(r.data)),
      loadCourse(),
    ]).finally(() => setLoading(false));
  }, [courseId]);

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
      return toast.error('Type, title, obtained and total marks are required');
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
    if (!confirm('Delete this marks record?')) return;
    try { await deleteMarks(id); toast.success('Deleted'); setRecords(rs => rs.filter(r => r._id !== id)); }
    catch { toast.error('Failed'); }
  };

  const filtered = tab === 'all' ? records : records.filter(r => r.type === tab);
  const quizzes  = records.filter(r => r.type === 'quiz');
  const mids     = records.filter(r => r.type === 'mid');
  const assigns  = records.filter(r => r.type === 'assignment');

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <MdArrowBack size={15} /> Back
        </button>
      </div>

      <PageHeader
        eyebrow={course?.code || 'Theory Course'}
        title={course ? `${course.name} — Marks` : 'Marks'}
        subtitle="Track your quiz, mid exam, and assignment scores"
        actions={<button className="btn btn-primary" onClick={openAdd}><MdAdd size={16} /> Add Record</button>}
      />

      {/* Summary stats */}
      <div className="stats-grid anim-fade-up delay-1">
        <div className="stat-card" style={{ borderTop: '3px solid var(--navy)' }}>
          <p className="stat-label">Total Records</p>
          <p className="stat-value">{records.length}</p>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--blue)' }}>
          <p className="stat-label">Quiz Avg</p>
          <p className="stat-value" style={{ color: 'var(--blue)' }}>
            {avg(quizzes) !== null ? `${avg(quizzes)}%` : '—'}
          </p>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--navy)' }}>
          <p className="stat-label">Mid Score</p>
          <p className="stat-value" style={{ color: 'var(--navy)' }}>
            {mids.length > 0 ? `${mids[0].obtainedMarks}/${mids[0].totalMarks}` : '—'}
          </p>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--amber)' }}>
          <p className="stat-label">Assignment Avg</p>
          <p className="stat-value" style={{ color: 'var(--amber)' }}>
            {assigns.length > 0 && avg(assigns) !== null ? `${avg(assigns)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Tabs */}
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

      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📊" title="No records"
          description="Add your first marks record to start tracking."
          action={<button className="btn btn-primary" onClick={openAdd}><MdAdd size={15} /> Add Record</button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((rec, i) => (
            <div key={rec._id} className={`card card-blue-border anim-fade-up delay-${Math.min(i + 1, 5)}`}
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
