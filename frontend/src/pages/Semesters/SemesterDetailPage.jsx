import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { MdAdd, MdEdit, MdDelete, MdScience, MdBook,
         MdArrowBack, MdOutlineQuiz } from 'react-icons/md';
import toast from 'react-hot-toast';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../../api/courses.js';
import { getSemesters } from '../../api/semesters.js';
import PageHeader from '../../components/UI/PageHeader.jsx';
import Modal from '../../components/UI/Modal.jsx';
import EmptyState from '../../components/UI/EmptyState.jsx';

const EMPTY_FORM = { name: '', code: '', type: 'theory', creditHours: 3 };

export default function SemesterDetailPage() {
  const { semesterId } = useParams();
  const navigate       = useNavigate();
  const [semester, setSemester] = useState(null);
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);

  const load = () =>
    Promise.all([
      getSemesters().then(r => setSemester(r.data.find(s => s._id === semesterId))),
      getCourses(semesterId).then(r => setCourses(r.data)),
    ]);

  useEffect(() => { load().finally(() => setLoading(false)); }, [semesterId]);

  const openAdd  = () => { setForm(EMPTY_FORM); setEditId(null); setModal(true); };
  const openEdit = (c) => {
    setForm({ name: c.name, code: c.code, type: c.type, creditHours: c.creditHours });
    setEditId(c._id);
    setModal(true);
  };
  const close = () => { setModal(false); setEditId(null); };

  const handleSave = async (formData) => {
    if (!formData.name || !formData.code) return toast.error('Name and code are required');
    setSaving(true);
    try {
      if (editId) {
        await updateCourse(editId, formData);
        toast.success('Course updated');
      } else {
        await createCourse(semesterId, formData);
        toast.success('Course added');
      }
      close();
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this course?')) return;
    try {
      await deleteCourse(id);
      toast.success('Course deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const theoryCourses = courses.filter(c => c.type === 'theory');
  const labCourses    = courses.filter(c => c.type === 'lab');

  const CourseCard = ({ course, idx }) => (
    <div className={`course-card anim-fade-up delay-${Math.min(idx + 1, 5)}`}>
      <div className="course-card-header">
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/courses/${course._id}`)}>
          <span className={`badge ${course.type === 'lab' ? 'badge-blue' : 'badge-navy'} mb-2`}>
            {course.type === 'lab' ? '🔬 Lab' : '📖 Theory'}
          </span>
          <h3 className="course-card-title">{course.name}</h3>
          <p className="course-card-code">{course.code} · {course.creditHours} CR</p>
        </div>
        <div className="flex gap-1" style={{ position: 'relative', zIndex: 1 }}>
          <button className="btn btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); openEdit(course); }}><MdEdit size={15}/></button>
          <button className="btn btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); handleDelete(course._id); }}
            style={{ color: 'var(--red)' }}><MdDelete size={15}/></button>
        </div>
      </div>

      <div className="course-card-actions">
        <button className="btn btn-outline btn-xs"
          onClick={() => navigate(`/courses/${course._id}#attendance`)}>
          📋 Attendance
        </button>
        {course.type === 'lab' && (
          <button className="btn btn-outline btn-xs"
            onClick={() => navigate(`/courses/${course._id}#labs`)}>
            🔬 Labs
          </button>
        )}
        <button className="btn btn-outline btn-xs"
          onClick={() => navigate(`/courses/${course._id}#marks`)}>
          📊 Marks
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/semesters')}>
          <MdArrowBack size={15} /> Semesters
        </button>
      </div>

      <PageHeader
        eyebrow={semester ? `${semester.name} ${semester.year}` : 'Semester'}
        title="Courses"
        subtitle="Manage all courses in this semester"
        actions={
          <button className="btn btn-primary" onClick={openAdd}>
            <MdAdd size={16} /> Add Course
          </button>
        }
      />

      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No courses yet"
          description="Add your first course for this semester."
          action={<button className="btn btn-primary" onClick={openAdd}><MdAdd size={15}/> Add Course</button>}
        />
      ) : (
        <>
          {theoryCourses.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="badge badge-navy">Theory</span>
                <span className="text-muted text-sm">{theoryCourses.length} course{theoryCourses.length !== 1 && 's'}</span>
              </div>
              <div className="courses-grid">
                {theoryCourses.map((c, i) => <CourseCard key={c._id} course={c} idx={i} />)}
              </div>
            </div>
          )}
          {labCourses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="badge badge-blue">Lab</span>
                <span className="text-muted text-sm">{labCourses.length} course{labCourses.length !== 1 && 's'}</span>
              </div>
              <div className="courses-grid">
                {labCourses.map((c, i) => <CourseCard key={c._id} course={c} idx={i} />)}
              </div>
            </div>
          )}
        </>
      )}

      {modal && (
        <CourseFormModal
          editId={editId}
          initialForm={form}
          onClose={close}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}

// Extract modal to its own component to prevent parent re-renders on every keystroke
function CourseFormModal({ editId, initialForm, onClose, onSave, saving }) {
  const [form, setForm] = useState(initialForm);

  return (
    <Modal
      title={editId ? 'Edit Course' : 'Add Course'}
      onClose={onClose}
      footer={<>
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </>}
    >
      <div className="form-group">
        <label className="form-label">Course Name</label>
        <input className="form-input" placeholder="e.g. Data Structures" autoFocus
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div className="form-group">
        <label className="form-label">Course Code</label>
        <input className="form-input" placeholder="e.g. CSE-3101"
          value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Type</label>
          <select className="form-select"
            value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="theory">Theory</option>
            <option value="lab">Lab</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Credit Hours</label>
          <input className="form-input" type="number" min={1} max={6}
            value={form.creditHours} onChange={e => setForm(f => ({ ...f, creditHours: +e.target.value }))} />
        </div>
      </div>
    </Modal>
  );
}

