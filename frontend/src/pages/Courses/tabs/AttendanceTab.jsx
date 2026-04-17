import { useEffect, useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdEmail, MdCheckBox, MdCheckBoxOutlineBlank, MdCheck } from 'react-icons/md';
import toast from 'react-hot-toast';
import moment from 'moment';
import { getAttendance, addAttendance, updateAttendance, deleteAttendance } from '../../../api/attendance.js';
import StatCard from '../../../components/UI/StatCard.jsx';
import Modal from '../../../components/UI/Modal.jsx';
import EmptyState from '../../../components/UI/EmptyState.jsx';

const EMPTY_FORM = { date: moment().format('YYYY-MM-DD'), status: 'present', remark: '', emailSent: false };

export default function AttendanceTab({ courseId }) {
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);

  const load = () => {
    setLoading(true);
    getAttendance(courseId).then(r => {
      setRecords(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [courseId]);

  const openAdd  = () => { setForm(EMPTY_FORM); setEditId(null); setModal(true); };
  const openEdit = (r) => {
    setForm({ date: moment(r.date).format('YYYY-MM-DD'), status: r.status, remark: r.remark, emailSent: r.emailSent });
    setEditId(r._id);
    setModal(true);
  };
  const close = () => { setModal(false); setEditId(null); };

  const handleSave = async () => {
    if (!form.date || !form.status) return toast.error('Date and status are required');
    setSaving(true);
    try {
      if (editId) {
        await updateAttendance(editId, form);
        toast.success('Record updated');
      } else {
        await addAttendance(courseId, form);
        toast.success('Record added');
      }
      close();
      getAttendance(courseId).then(r => setRecords(r.data));
    } catch (e) { toast.error(e?.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return;
    try {
      await deleteAttendance(id);
      toast.success('Deleted');
      setRecords(rs => rs.filter(r => r._id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const toggleEmail = async (rec) => {
    try {
      const updated = await updateAttendance(rec._id, { ...rec, emailSent: !rec.emailSent });
      setRecords(rs => rs.map(r => r._id === rec._id ? updated.data : r));
    } catch { toast.error('Failed to update'); }
  };

  const total   = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent  = records.filter(r => r.status === 'absent').length;
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0;
  const absentPending = records.filter(r => r.status === 'absent' && !r.emailSent).length;

  const pctColor = total === 0 ? 'var(--blue)'
    : pct >= 75 ? 'var(--green)'
    : pct >= 60 ? 'var(--amber)'
    : 'var(--red)';

  return (
    <div className="tab-pane-content">
      {/* Stats */}
      <div className="stats-grid anim-fade-up delay-1">
        <StatCard label="Total Classes"    value={total}   accentColor="var(--navy)" />
        <StatCard label="Present"          value={present} accentColor="var(--green)" />
        <StatCard label="Absent"           value={absent}  accentColor="var(--red)" />
        <StatCard label="Attendance"       value={`${pct}%`} accentColor={pctColor}
          sub={total > 0 ? `${present} of ${total} classes` : 'No records yet'} />
      </div>

      <div className="flex justify-between items-center mb-6 anim-fade-up delay-2">
        <h3 className="section-title">Class Logs</h3>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <MdAdd size={16} /> Add Class
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : records.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No classes recorded"
          description="Start tracking your attendance for this course."
          action={<button className="btn btn-primary" onClick={openAdd}><MdAdd size={15}/> Add Class</button>}
        />
      ) : (
        <div className="table-wrap anim-fade-up delay-3">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Status</th>
                <th>Remark</th>
                <th>Email Sent</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, i) => (
                <tr key={rec._id}>
                  <td style={{ color: 'var(--text-faint)', fontWeight: 600, width: 40 }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{moment(rec.date).format('DD MMM YYYY')}</td>
                  <td>
                    <span className={`badge ${rec.status === 'present' ? 'badge-green' : 'badge-red'}`}>
                      {rec.status === 'present' ? '✓ Present' : '✗ Absent'}
                    </span>
                  </td>
                  <td style={{ maxWidth: 200, color: rec.remark ? 'var(--text-mid)' : 'var(--text-faint)' }}>
                    {rec.remark || '—'}
                  </td>
                  <td>
                    {rec.status === 'absent' ? (
                      <button
                        className="checkbox-wrap"
                        onClick={() => toggleEmail(rec)}
                        title={rec.emailSent ? 'Mark email not sent' : 'Mark email sent'}
                        style={{ background: 'none', border: 'none' }}
                      >
                        {rec.emailSent
                          ? <MdCheckBox size={20} style={{ color: 'var(--blue)' }} />
                          : <MdCheckBoxOutlineBlank size={20} style={{ color: 'var(--text-faint)' }} />
                        }
                        <span className="checkbox-label">
                          {rec.emailSent ? 'Sent' : 'Pending'}
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1 justify-end">
                      <button className="btn btn-ghost btn-icon" onClick={() => openEdit(rec)}><MdEdit size={15}/></button>
                      <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(rec._id)}
                        style={{ color: 'var(--red)' }}><MdDelete size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          premium={true}
          title={editId ? 'Edit Attendance Record' : 'Add Class Record'}
          onClose={close}
          footer={
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" style={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.1)' }} onClick={close}>Cancel</button>
              <button className="btn-premium" style={{ padding: '10px 24px', fontSize: 14 }} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Record'}
              </button>
            </div>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="glass-form-group">
              <label className="glass-label">Date</label>
              <div className="glass-input-wrapper">
                <input type="date" className="glass-input"
                  value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="glass-form-group">
              <label className="glass-label">Status</label>
              <div className="glass-input-wrapper">
                <select className="glass-select"
                  value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
            </div>
          </div>
          <div className="glass-form-group">
            <label className="glass-label">Remark (Optional)</label>
            <div className="glass-input-wrapper">
              <textarea className="glass-input" placeholder="Any notes for this class…"
                style={{ minHeight: 80, resize: 'vertical' }}
                value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} />
            </div>
          </div>
          {form.status === 'absent' && (
            <div 
              onClick={() => setForm(f => ({ ...f, emailSent: !f.emailSent }))}
              style={{ 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: 20, 
                padding: '16px 20px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: -4,
                marginBottom: 10
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              <div style={{ 
                width: 24, height: 24, 
                borderRadius: 8, 
                background: form.emailSent ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                {form.emailSent && <MdCheck size={16} color="#fff" />}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: form.emailSent ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                <MdEmail size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Email sent to teacher for leave of absence
              </span>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
