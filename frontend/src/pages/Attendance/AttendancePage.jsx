import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { MdAdd, MdEdit, MdDelete, MdArrowBack, MdEmail, MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';
import toast from 'react-hot-toast';
import moment from 'moment';
import { getAttendance, addAttendance, updateAttendance, deleteAttendance } from '../../api/attendance.js';
import { getCourses } from '../../api/courses.js';
import { getSemesters } from '../../api/semesters.js';
import PageHeader from '../../components/UI/PageHeader.jsx';
import StatCard from '../../components/UI/StatCard.jsx';
import Modal from '../../components/UI/Modal.jsx';
import EmptyState from '../../components/UI/EmptyState.jsx';

const EMPTY_FORM = { date: moment().format('YYYY-MM-DD'), status: 'present', remark: '', emailSent: false };

export default function AttendancePage() {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  const [course,   setCourse]   = useState(null);
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);

  const load = () =>
    Promise.all([
      getAttendance(courseId).then(r => setRecords(r.data)),
      getCourses('dummy').catch(() => null), // will fall back
    ]);

  const loadCourse = () =>
    getSemesters().then(async res => {
      for (const sem of res.data) {
        const r = await getCourses(sem._id);
        const c = r.data.find(c => c._id === courseId);
        if (c) { setCourse(c); return; }
      }
    });

  useEffect(() => {
    Promise.all([
      getAttendance(courseId).then(r => setRecords(r.data)),
      loadCourse(),
    ]).finally(() => setLoading(false));
  }, [courseId]);

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
    <div className="page-wrapper">
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <MdArrowBack size={15} /> Back
        </button>
      </div>

      <PageHeader
        eyebrow={course?.code || 'Course'}
        title={course ? `${course.name} — Attendance` : 'Attendance'}
        subtitle="Track your class attendance, add remarks, and manage email notifications"
        actions={
          <button className="btn btn-primary" onClick={openAdd}>
            <MdAdd size={16} /> Add Class
          </button>
        }
      />

      {/* Stats */}
      <div className="stats-grid anim-fade-up delay-1">
        <StatCard label="Total Classes"    value={total}   accentColor="var(--navy)" />
        <StatCard label="Present"          value={present} accentColor="var(--green)" />
        <StatCard label="Absent"           value={absent}  accentColor="var(--red)" />
        <StatCard label="Attendance"       value={`${pct}%`} accentColor={pctColor}
          sub={total > 0 ? `${present} of ${total} classes` : 'No records yet'} />
        {absentPending > 0 && (
          <StatCard label="Emails Pending" value={absentPending} accentColor="var(--amber)"
            sub="Absent — email not sent" />
        )}
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="anim-fade-up delay-2" style={{ marginBottom: 24 }}>
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>Attendance rate</span><span style={{ color: pctColor, fontWeight: 700 }}>{pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%`, background: pctColor }} />
          </div>
          {pct < 75 && (
            <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}>
              ⚠️ Below 75% minimum attendance threshold
            </p>
          )}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : records.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No classes recorded"
          description="Start tracking your attendance by adding a class record."
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
          title={editId ? 'Edit Attendance Record' : 'Add Class Record'}
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
              <label className="form-label">Date</label>
              <input type="date" className="form-input"
                value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select"
                value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Remark (Optional)</label>
            <textarea className="form-textarea" placeholder="Any notes for this class…"
              value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} />
          </div>
          {form.status === 'absent' && (
            <label className="checkbox-wrap">
              <input type="checkbox" checked={form.emailSent}
                onChange={e => setForm(f => ({ ...f, emailSent: e.target.checked }))} />
              <span className="checkbox-label">
                <MdEmail size={14} style={{ display: 'inline', marginRight: 4 }} />
                Email sent to sir for leave of absence
              </span>
            </label>
          )}
        </Modal>
      )}
    </div>
  );
}
