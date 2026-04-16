import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { MdAdd, MdEdit, MdDelete, MdStar, MdStarOutline, MdCalendarToday } from 'react-icons/md';
import toast from 'react-hot-toast';
import {
  getSemesters, createSemester, updateSemester,
  deleteSemester, activateSemester
} from '../../api/semesters.js';
import PageHeader from '../../components/UI/PageHeader.jsx';
import Modal from '../../components/UI/Modal.jsx';
import EmptyState from '../../components/UI/EmptyState.jsx';

const EMPTY_FORM = { name: '', year: new Date().getFullYear() };

export default function SemestersPage() {
  const [semesters, setSemesters] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null); // null | 'add' | 'edit'
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [editId,    setEditId]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const navigate = useNavigate();

  const load = () =>
    getSemesters().then(r => setSemesters(r.data)).catch(() => toast.error('Failed to load'));

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const openAdd  = () => { setForm(EMPTY_FORM); setEditId(null); setModal('form'); };
  const openEdit = (s) => { setForm({ name: s.name, year: s.year }); setEditId(s._id); setModal('form'); };
  const close    = () => { setModal(null); setEditId(null); };

  const handleSave = async () => {
    if (!form.name || !form.year) return toast.error('Name and year are required');
    setSaving(true);
    try {
      if (editId) {
        await updateSemester(editId, form);
        toast.success('Semester updated');
      } else {
        await createSemester(form);
        toast.success('Semester created');
      }
      close();
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this semester? All associated courses will still exist.')) return;
    try {
      await deleteSemester(id);
      toast.success('Semester deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const handleActivate = async (id) => {
    try {
      await activateSemester(id);
      toast.success('Semester set as active');
      load();
    } catch { toast.error('Failed to activate'); }
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        eyebrow="Academic Calendar"
        title="Semesters"
        subtitle="Manage your academic semesters and set the active one"
        actions={
          <button className="btn btn-primary" onClick={openAdd}>
            <MdAdd size={16} /> New Semester
          </button>
        }
      />

      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : semesters.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No semesters yet"
          description="Add your first semester to start organizing courses."
          action={<button className="btn btn-primary" onClick={openAdd}><MdAdd size={15} /> Add Semester</button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {semesters.map((s, i) => (
            <div
              key={s._id}
              className={`card card-blue-border anim-fade-up delay-${Math.min(i + 1, 5)}`}
              style={{ borderLeftColor: s.isActive ? 'var(--blue)' : 'var(--border-mid)' }}
            >
              <div className="card-body flex items-center justify-between" style={{ gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <MdCalendarToday size={14} style={{ color: 'var(--blue)' }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700 }}>
                      {s.name}
                    </span>
                    {s.isActive && <span className="badge badge-blue">Active</span>}
                  </div>
                  <p className="text-sm text-muted">{s.year}</p>
                </div>

                <div className="flex gap-2 items-center">
                  {!s.isActive && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleActivate(s._id)}
                      title="Set as active semester"
                    >
                      <MdStarOutline size={15} /> Set Active
                    </button>
                  )}
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/semesters/${s._id}`)}
                  >
                    View Courses
                  </button>
                  <button className="btn btn-ghost btn-icon" onClick={() => openEdit(s)} title="Edit">
                    <MdEdit size={16} />
                  </button>
                  <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(s._id)} title="Delete"
                    style={{ color: 'var(--red)' }}>
                    <MdDelete size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === 'form' && (
        <Modal
          title={editId ? 'Edit Semester' : 'New Semester'}
          onClose={close}
          footer={<>
            <button className="btn btn-outline" onClick={close}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>}
        >
          <div className="form-group">
            <label className="form-label">Semester Name</label>
            <input className="form-input" placeholder="e.g. Spring 2025"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Year</label>
            <input className="form-input" type="number" placeholder="2025"
              value={form.year} onChange={e => setForm(f => ({ ...f, year: +e.target.value }))} />
          </div>
        </Modal>
      )}
    </div>
  );
}
