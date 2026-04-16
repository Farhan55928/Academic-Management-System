import { useEffect, useState } from 'react';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import toast from 'react-hot-toast';
import moment from 'moment';
import { getLabs, addLab, updateLab, deleteLab } from '../../../api/labs.js';
import StatCard from '../../../components/UI/StatCard.jsx';
import Modal from '../../../components/UI/Modal.jsx';
import EmptyState from '../../../components/UI/EmptyState.jsx';

const TASK_STATUS_OPTIONS   = ['pending', 'completed', 'not_required'];
const REPORT_STATUS_OPTIONS = ['pending', 'submitted', 'graded', 'not_required'];

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

const EMPTY_FORM = {
  labNumber: '', title: '', date: moment().format('YYYY-MM-DD'),
  taskStatus: 'pending', taskRemark: '',
  reportStatus: 'pending', reportRemark: '', reportMarks: ''
};

export default function LabsTab({ courseId }) {
  const [labs,    setLabs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [editId,  setEditId]  = useState(null);
  const [saving,  setSaving]  = useState(false);

  const load = () => {
    setLoading(true);
    getLabs(courseId).then(r => {
      setLabs(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [courseId]);

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
      if (editId) { await updateLab(editId, payload); toast.success('Lab updated'); }
      else { await addLab(courseId, payload); toast.success('Lab added'); }
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
    <div className="tab-pane-content">
      <div className="stats-grid anim-fade-up delay-1">
        <StatCard label="Total Labs"     value={labs.length} accentColor="var(--navy)" />
        <StatCard label="Tasks Done"     value={completed}   accentColor="var(--green)" />
        <StatCard label="Reports Graded" value={graded}      accentColor="var(--blue)" />
        <StatCard label="Reports Pending" value={pending}     accentColor="var(--amber)" />
      </div>

      <div className="flex justify-between items-center mb-6 anim-fade-up delay-2">
        <h3 className="section-title">Lab Management</h3>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <MdAdd size={16} /> Add Lab
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : labs.length === 0 ? (
        <EmptyState icon="🔬" title="No labs recorded"
          description="Start tracking your lab tasks and reports."
          action={<button className="btn btn-primary" onClick={openAdd}><MdAdd size={15} /> Add Lab</button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {labs.map((lab, i) => (
            <div key={lab._id} className="card anim-fade-up">
              <div className="card-body">
                <div className="flex items-start justify-between gap-3">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge badge-navy" style={{ padding: '2px 8px' }}>Lab {lab.labNumber}</span>
                      {lab.date && <span className="text-xs text-muted">{moment(lab.date).format('DD MMM YYYY')}</span>}
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>
                      {lab.title}
                    </h3>

                    <div className="flex gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted mb-1">Task</p>
                        <StatusPill value={lab.taskStatus} />
                        {lab.taskRemark && <p className="text-xs text-muted mt-1">{lab.taskRemark}</p>}
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-1">Report</p>
                        <StatusPill value={lab.reportStatus} />
                        {lab.reportMarks !== null && (
                          <p className="text-xs font-bold mt-1" style={{ color: 'var(--blue)' }}>Marks: {lab.reportMarks}</p>
                        )}
                        {lab.reportRemark && <p className="text-xs text-muted mt-1">{lab.reportRemark}</p>}
                      </div>
                    </div>
                  </div>
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
              <input className="form-input" placeholder="e.g. Experiment 1"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input"
              value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              <p className="text-xs font-bold mb-2">Task</p>
              <div className="form-group">
                <select className="form-select"
                  value={form.taskStatus} onChange={e => setForm(f => ({ ...f, taskStatus: e.target.value }))}>
                  {TASK_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group mt-2">
                <input className="form-input" placeholder="Task remark…"
                  value={form.taskRemark} onChange={e => setForm(f => ({ ...f, taskRemark: e.target.value }))} />
              </div>
            </div>

            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              <p className="text-xs font-bold mb-2">Report</p>
              <div className="form-group">
                <select className="form-select"
                  value={form.reportStatus} onChange={e => setForm(f => ({ ...f, reportStatus: e.target.value }))}>
                  {REPORT_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group mt-2">
                <input className="form-input" placeholder="Marks" type="number"
                  value={form.reportMarks} onChange={e => setForm(f => ({ ...f, reportMarks: e.target.value }))} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
