import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { MdAdd, MdEdit, MdDelete, MdArrowBack } from 'react-icons/md';
import toast from 'react-hot-toast';
import moment from 'moment';
import { getLabs, addLab, updateLab, deleteLab } from '../../api/labs.js';
import { getSemesters } from '../../api/semesters.js';
import { getCourses } from '../../api/courses.js';
import PageHeader from '../../components/UI/PageHeader.jsx';
import Modal from '../../components/UI/Modal.jsx';
import EmptyState from '../../components/UI/EmptyState.jsx';

const TASK_STATUS_OPTIONS   = ['pending', 'completed', 'not_required'];
const REPORT_STATUS_OPTIONS = ['pending', 'submitted', 'graded', 'not_required'];

const EMPTY_FORM = {
  labNumber: '', title: '', date: moment().format('YYYY-MM-DD'),
  taskStatus: 'pending', taskRemark: '',
  reportStatus: 'pending', reportRemark: '', reportMarks: ''
};

function StatusPill({ value }) {
  const map = {
    pending:      'badge-amber',
    completed:    'badge-green',
    submitted:    'badge-blue',
    graded:       'badge-navy',
    not_required: 'badge-slate',
  };
  const labels = {
    pending: 'Pending', completed: 'Completed', submitted: 'Submitted',
    graded: 'Graded', not_required: 'N/A',
  };
  return <span className={`badge ${map[value] || 'badge-slate'}`}>{labels[value] || value}</span>;
}

export default function LabsPage() {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  const [course,  setCourse]  = useState(null);
  const [labs,    setLabs]    = useState([]);
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
      getLabs(courseId).then(r => setLabs(r.data)),
      loadCourse(),
    ]).finally(() => setLoading(false));
  }, [courseId]);

  const openAdd  = () => { setForm({ ...EMPTY_FORM, labNumber: labs.length + 1 }); setEditId(null); setModal(true); };
  const openEdit = (l) => {
    setForm({
      labNumber: l.labNumber, title: l.title,
      date: l.date ? moment(l.date).format('YYYY-MM-DD') : '',
      taskStatus: l.taskStatus, taskRemark: l.taskRemark,
      reportStatus: l.reportStatus, reportRemark: l.reportRemark,
      reportMarks: l.reportMarks ?? ''
    });
    setEditId(l._id);
    setModal(true);
  };
  const close = () => { setModal(false); setEditId(null); };

  const handleSave = async () => {
    if (!form.labNumber || !form.title) return toast.error('Lab number and title required');
    setSaving(true);
    const payload = {
      ...form,
      reportMarks: form.reportMarks !== '' ? Number(form.reportMarks) : null,
    };
    try {
      if (editId) {
        await updateLab(editId, payload); toast.success('Lab updated');
      } else {
        await addLab(courseId, payload); toast.success('Lab added');
      }
      close();
      getLabs(courseId).then(r => setLabs(r.data));
    } catch (e) { toast.error(e?.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lab record?')) return;
    try { await deleteLab(id); toast.success('Deleted'); setLabs(ls => ls.filter(l => l._id !== id)); }
    catch { toast.error('Failed to delete'); }
  };

  const completed = labs.filter(l => l.taskStatus === 'completed').length;
  const graded    = labs.filter(l => l.reportStatus === 'graded').length;
  const pending   = labs.filter(l => l.reportStatus === 'pending').length;

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <MdArrowBack size={15} /> Back
        </button>
      </div>

      <PageHeader
        eyebrow={course?.code || 'Lab Course'}
        title={course ? `${course.name} — Labs` : 'Lab Records'}
        subtitle="Track lab tasks and report submission status"
        actions={
          <button className="btn btn-primary" onClick={openAdd}><MdAdd size={16} /> Add Lab</button>
        }
      />

      {/* Stats */}
      <div className="stats-grid anim-fade-up delay-1">
        <div className="stat-card" style={{ borderTop: '3px solid var(--navy)' }}>
          <p className="stat-label">Total Labs</p>
          <p className="stat-value">{labs.length}</p>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--green)' }}>
          <p className="stat-label">Tasks Done</p>
          <p className="stat-value" style={{ color: 'var(--green)' }}>{completed}</p>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--blue)' }}>
          <p className="stat-label">Reports Graded</p>
          <p className="stat-value" style={{ color: 'var(--blue)' }}>{graded}</p>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--amber)' }}>
          <p className="stat-label">Reports Pending</p>
          <p className="stat-value" style={{ color: 'var(--amber)' }}>{pending}</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : labs.length === 0 ? (
        <EmptyState icon="🔬" title="No labs recorded"
          description="Add your first lab record to start tracking."
          action={<button className="btn btn-primary" onClick={openAdd}><MdAdd size={15} /> Add Lab</button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {labs.map((lab, i) => (
            <div key={lab._id} className={`card anim-fade-up delay-${Math.min(i + 1, 5)}`}>
              <div className="card-body">
                <div className="flex items-start justify-between gap-3">
                  {/* Left */}
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, background: 'var(--navy)', color: '#fff',
                        borderRadius: 6, fontWeight: 700, fontSize: 13, flexShrink: 0
                      }}>
                        {lab.labNumber}
                      </span>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>
                        {lab.title}
                      </h3>
                    </div>
                    {lab.date && (
                      <p className="text-xs text-muted mb-2">
                        {moment(lab.date).format('DD MMM YYYY')}
                      </p>
                    )}

                    {/* Status row */}
                    <div className="flex gap-4" style={{ flexWrap: 'wrap', marginTop: 8 }}>
                      <div>
                        <p className="text-xs text-muted mb-1">Task</p>
                        <StatusPill value={lab.taskStatus} />
                        {lab.taskRemark && <p className="text-xs text-muted mt-1">{lab.taskRemark}</p>}
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-1">Report</p>
                        <StatusPill value={lab.reportStatus} />
                        {lab.reportMarks !== null && lab.reportMarks !== undefined && (
                          <p className="text-xs" style={{ color: 'var(--blue)', fontWeight: 700, marginTop: 4 }}>
                            Marks: {lab.reportMarks}
                          </p>
                        )}
                        {lab.reportRemark && <p className="text-xs text-muted mt-1">{lab.reportRemark}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-icon" onClick={() => openEdit(lab)}><MdEdit size={15}/></button>
                    <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(lab._id)}
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
          title={editId ? 'Edit Lab Record' : 'Add Lab Record'}
          onClose={close}
          footer={<>
            <button className="btn btn-outline" onClick={close}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Lab #</label>
              <input type="number" className="form-input" min={1}
                value={form.labNumber} onChange={e => setForm(f => ({ ...f, labNumber: +e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" placeholder="e.g. Basic Circuit Analysis"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input"
              value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
              🔧 Task
            </p>
            <div className="form-group">
              <label className="form-label">Task Status</label>
              <select className="form-select"
                value={form.taskStatus} onChange={e => setForm(f => ({ ...f, taskStatus: e.target.value }))}>
                {TASK_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginTop: 10 }}>
              <label className="form-label">Task Remark</label>
              <input className="form-input" placeholder="Optional note…"
                value={form.taskRemark} onChange={e => setForm(f => ({ ...f, taskRemark: e.target.value }))} />
            </div>
          </div>

          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
              📄 Report
            </p>
            <div className="form-group">
              <label className="form-label">Report Status</label>
              <select className="form-select"
                value={form.reportStatus} onChange={e => setForm(f => ({ ...f, reportStatus: e.target.value }))}>
                {REPORT_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10, marginTop: 10 }}>
              <div className="form-group">
                <label className="form-label">Report Remark</label>
                <input className="form-input" placeholder="Optional note…"
                  value={form.reportRemark} onChange={e => setForm(f => ({ ...f, reportRemark: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Marks</label>
                <input type="number" className="form-input" placeholder="—" min={0}
                  value={form.reportMarks} onChange={e => setForm(f => ({ ...f, reportMarks: e.target.value }))} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
