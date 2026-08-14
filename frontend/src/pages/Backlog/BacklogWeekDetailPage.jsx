import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router';
import { MdAdd, MdArrowBack, MdPrint, MdClose } from 'react-icons/md';
import toast from 'react-hot-toast';
import {
  getWeekDetails,
  createSection, updateSection, deleteSection,
  createSubsection, updateSubsection, deleteSubsection,
  createStep, updateStep, deleteStep,
  reorder,
} from '../../api/backlog.js';
import { getCourses } from '../../api/courses.js';
import { getSemesters } from '../../api/semesters.js';
import BacklogSectionCard from './BacklogSectionCard.jsx';
import {
  meterColor, setStepDone, setSubsectionDone, setSectionDone,
  appendSteps, removeStep as removeStepFromTree, renameStep as renameStepInTree,
  moveItem,
} from './backlogUtils.js';

const openKey = (weekId) => `ams_backlog_open_${weekId}`;

export default function BacklogWeekDetailPage() {
  const { weekId } = useParams();

  const [week,     setWeek]     = useState(null);
  const [courses,  setCourses]  = useState([]);
  const [semester, setSemester] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [hideDone, setHideDone] = useState(false);
  const [open,     setOpen]     = useState(new Set());
  const seeded = useRef(false);

  const [modal,    setModal]    = useState(null); // null | 'section' | 'subsection'
  const [form,     setForm]     = useState(null);
  const [editId,   setEditId]   = useState(null);
  const [parentId, setParentId] = useState(null);
  const [saving,   setSaving]   = useState(false);

  const load = () =>
    getWeekDetails(weekId)
      .then((r) => {
        setWeek(r.data);
        // Only on the very first visit to this week — later refetches (after adding a
        // subsection, say) must leave whatever the user has expanded alone
        if (!seeded.current) {
          seeded.current = true;
          setOpen(new Set(r.data.sections.map((s) => s._id)));
        }
        return r.data;
      })
      .catch(() => toast.error('Failed to load week'));

  useEffect(() => {
    const stored = localStorage.getItem(openKey(weekId));
    seeded.current = !!stored;
    setOpen(stored ? new Set(JSON.parse(stored)) : new Set());
    load().finally(() => setLoading(false));
  }, [weekId]);

  // Persist expansion state on every change, so a refetch can't reset it
  useEffect(() => {
    localStorage.setItem(openKey(weekId), JSON.stringify([...open]));
  }, [open, weekId]);

  // Courses of this week's semester feed the optional "link a course" dropdown
  useEffect(() => {
    if (!week?.semester) return;
    getCourses(week.semester).then((r) => setCourses(r.data)).catch(() => {});
    getSemesters()
      .then((r) => setSemester(r.data.find((s) => s._id === week.semester) || null))
      .catch(() => {});
  }, [week?.semester]);

  const toggleOpen = (id) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // ─── Optimistic toggles ───────────────────────────────────
  // The tree updates instantly and rolls up locally. `apply` takes the previous
  // tree so back-to-back clicks can't build on stale state; a failed request
  // resyncs from the server rather than guessing at a rollback.

  const optimistic = async (apply, request, errorMessage) => {
    setWeek(apply);
    try {
      await request();
    } catch {
      toast.error(errorMessage);
      load();
    }
  };

  const toggleStep = (subsectionId, step) => optimistic(
    (prev) => setStepDone(prev, subsectionId, step._id, !step.isDone),
    () => updateStep(step._id, { isDone: !step.isDone }),
    'Failed to update step'
  );

  const toggleSubsection = (sub) => optimistic(
    (prev) => setSubsectionDone(prev, sub._id, !sub.isDone),
    () => updateSubsection(sub._id, { isDone: !sub.isDone }),
    'Failed to update subsection'
  );

  const toggleSection = (section) => optimistic(
    (prev) => setSectionDone(prev, section._id, !section.isDone),
    () => updateSection(section._id, { isDone: !section.isDone }),
    'Failed to update section'
  );

  // ─── Steps ────────────────────────────────────────────────

  // Pasting several lines at once creates one step per line
  const addSteps = async (subsectionId, raw) => {
    const titles = raw.split('\n').map((t) => t.trim()).filter(Boolean);
    if (titles.length === 0) return;
    try {
      const created = [];
      for (const title of titles) created.push((await createStep(subsectionId, { title })).data);
      setWeek((prev) => appendSteps(prev, subsectionId, created));
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to add step');
      load();
    }
  };

  const renameStep = async (subsectionId, step, title) => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === step.title) return;
    setWeek((prev) => renameStepInTree(prev, subsectionId, step._id, trimmed));
    try {
      await updateStep(step._id, { title: trimmed });
    } catch { toast.error('Failed to rename step'); load(); }
  };

  const removeStep = async (subsectionId, step) => {
    setWeek((prev) => removeStepFromTree(prev, subsectionId, step._id));
    try {
      await deleteStep(step._id);
    } catch { toast.error('Failed to delete step'); load(); }
  };

  // ─── Sections ─────────────────────────────────────────────

  const openAddSection  = () => { setForm({ title: '', course: '' }); setEditId(null); setModal('section'); };
  const openEditSection = (s) => { setForm({ title: s.title, course: s.course || '' }); setEditId(s._id); setModal('section'); };

  const saveSection = async (formData) => {
    if (!formData.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      if (editId) {
        await updateSection(editId, formData);
        toast.success('Section updated');
      } else {
        const res = await createSection(weekId, formData);
        setOpen((prev) => new Set(prev).add(res.data._id));
        toast.success('Section added');
      }
      closeModal();
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const removeSection = async (section) => {
    if (!confirm(`Delete "${section.title}"? Its subsections and steps will be removed too.`)) return;
    try {
      await deleteSection(section._id);
      toast.success('Section deleted');
      load();
    } catch { toast.error('Failed to delete section'); }
  };

  // ─── Subsections ──────────────────────────────────────────

  const openAddSubsection = (sectionId) => {
    setForm({ title: '', priority: 'none' });
    setEditId(null);
    setParentId(sectionId);
    setModal('subsection');
  };

  const openEditSubsection = (sub) => {
    setForm({ title: sub.title, priority: sub.priority });
    setEditId(sub._id);
    setParentId(sub.sectionId);
    setModal('subsection');
  };

  const saveSubsection = async (formData) => {
    if (!formData.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      if (editId) {
        await updateSubsection(editId, formData);
        toast.success('Subsection updated');
      } else {
        const res = await createSubsection(parentId, formData);
        setOpen((prev) => new Set(prev).add(res.data._id));
        toast.success('Subsection added');
      }
      closeModal();
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const removeSubsection = async (sub) => {
    if (!confirm(`Delete "${sub.title}"? Its steps will be removed too.`)) return;
    try {
      await deleteSubsection(sub._id);
      toast.success('Subsection deleted');
      load();
    } catch { toast.error('Failed to delete subsection'); }
  };

  // ─── Reordering ───────────────────────────────────────────

  const moveSection = async (index, direction) => {
    const next = moveItem(week.sections, index, direction);
    if (!next) return;
    setWeek({ ...week, sections: next });
    try {
      await reorder({ type: 'section', ids: next.map((s) => s._id) });
    } catch { toast.error('Failed to reorder'); load(); }
  };

  const moveSubsection = async (section, index, direction) => {
    const next = moveItem(section.subsections, index, direction);
    if (!next) return;
    setWeek({
      ...week,
      sections: week.sections.map((s) => (s._id === section._id ? { ...s, subsections: next } : s)),
    });
    try {
      await reorder({ type: 'subsection', ids: next.map((s) => s._id) });
    } catch { toast.error('Failed to reorder'); load(); }
  };

  const closeModal = () => { setModal(null); setEditId(null); setParentId(null); };

  // ─── Render ───────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #dbeafe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (!week) return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <p style={{ fontSize: 18, color: '#64748b', marginBottom: 8 }}>Week not found.</p>
      <Link to="/backlog" style={{ color: '#3b82f6', fontWeight: 700, textDecoration: 'none' }}>← Back to Backlog</Link>
    </div>
  );

  const total = week.sections.reduce((n, s) => n + s.progress.total, 0);
  const done  = week.sections.reduce((n, s) => n + s.progress.done, 0);
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  const pendingSubs = week.sections.reduce((n, s) => n + s.subsections.filter((x) => !x.isDone).length, 0);

  const visibleSections = hideDone ? week.sections.filter((s) => !s.isDone) : week.sections;

  return (
    <>
      <div className="backlog-page" style={{ minHeight: '100vh', background: '#f0f4f9' }}>

        {/* ── Hero ─────────────────────────────────────── */}
        <div className="hero-section" style={{
          background: 'linear-gradient(135deg, #0f1e3c 0%, #1a2f5e 60%, #1e3a6e 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Link to="/backlog" className="no-print" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(96,165,250,0.8)', fontSize: 13, fontWeight: 700, marginBottom: 20, textDecoration: 'none' }}>
              <MdArrowBack size={18} /> Back to Backlog
            </Link>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.25em', color: 'rgba(96,165,250,0.8)', textTransform: 'uppercase', marginBottom: 10 }}>
              Academic Backlog{semester ? ` • ${semester.name} ${semester.year}` : ''}
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 6 }}>
                  Week <span style={{ fontVariantNumeric: 'tabular-nums' }}>{week.weekNumber}</span>
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                  {total > 0 ? `${done} of ${total} steps complete` : 'Nothing tracked yet — add a section to begin'}
                </p>
              </div>
              <div className="no-print" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={() => window.print()}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', color: 'rgba(255,255,255,0.85)', padding: '14px 24px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                >
                  <MdPrint size={20} /> Print
                </button>
                <button
                  onClick={openAddSection}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#3b82f6', color: '#fff', padding: '14px 28px', borderRadius: 16, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(59,130,246,0.4)' }}
                >
                  <MdAdd size={22} /> New Section
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section" style={{ paddingBottom: 60 }}>
          {/* ── Summary Cards ─────────────────────────── */}
          <div className="stats-grid no-print" style={{ marginBottom: 36 }}>
            <div style={{ background: '#fff', borderRadius: 24, padding: '28px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', borderTop: `4px solid ${meterColor(pct)}` }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>Steps Complete</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                {done}<span style={{ fontSize: 18, fontWeight: 600, color: '#94a3b8' }}> / {total}</span>
              </p>
              <div style={{ marginTop: 10, background: '#f1f5f9', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: meterColor(pct), borderRadius: 999, transition: 'width 0.5s ease' }} />
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{pct}% done</p>
            </div>

            <div style={{ background: '#fff', borderRadius: 24, padding: '28px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', borderTop: '4px solid #6366f1' }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>Sections</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>
                {week.sections.length} <span style={{ fontSize: 16, fontWeight: 500, color: '#94a3b8' }}>courses</span>
              </p>
            </div>

            <div style={{ background: '#fff', borderRadius: 24, padding: '28px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', borderTop: `4px solid ${pendingSubs > 0 ? '#f59e0b' : '#10b981'}` }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>Still Pending</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: pendingSubs > 0 ? '#f59e0b' : '#10b981' }}>
                {pendingSubs} <span style={{ fontSize: 16, fontWeight: 500, color: '#94a3b8' }}>items</span>
              </p>
            </div>
          </div>

          {/* ── Filter bar ────────────────────────────── */}
          {week.sections.length > 0 && (
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94a3b8' }}>
                Checklist
              </p>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '10px 18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <input
                  type="checkbox"
                  checked={hideDone}
                  onChange={(e) => setHideDone(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Hide completed</span>
              </label>
            </div>
          )}

          {/* ── Tree ──────────────────────────────────── */}
          {week.sections.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 28, padding: '80px 40px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 52, marginBottom: 16 }}>📚</p>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Empty Week</h3>
              <p style={{ color: '#64748b', marginBottom: 28 }}>Add a section per course, then break each one into subsections and steps.</p>
              <button onClick={openAddSection} style={{ background: '#3b82f6', color: '#fff', padding: '14px 32px', borderRadius: 14, border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 6px 20px rgba(59,130,246,0.3)' }}>
                Add First Section
              </button>
            </div>
          ) : (
            <div className="backlog-tree" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {visibleSections.map((section) => (
                <BacklogSectionCard
                  key={section._id}
                  section={section}
                  index={week.sections.indexOf(section)}
                  sectionCount={week.sections.length}
                  open={open}
                  hideDone={hideDone}
                  onToggleOpen={toggleOpen}
                  onToggleSection={toggleSection}
                  onToggleSubsection={toggleSubsection}
                  onToggleStep={toggleStep}
                  onEditSection={openEditSection}
                  onDeleteSection={removeSection}
                  onMoveSection={moveSection}
                  onAddSubsection={openAddSubsection}
                  onEditSubsection={openEditSubsection}
                  onDeleteSubsection={removeSubsection}
                  onMoveSubsection={moveSubsection}
                  onAddSteps={addSteps}
                  onRenameStep={renameStep}
                  onDeleteStep={removeStep}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {modal === 'section' && (
        <SectionFormModal
          editId={editId}
          initialForm={form}
          courses={courses}
          onClose={closeModal}
          onSave={saveSection}
          saving={saving}
        />
      )}

      {modal === 'subsection' && (
        <SubsectionFormModal
          editId={editId}
          initialForm={form}
          onClose={closeModal}
          onSave={saveSubsection}
          saving={saving}
        />
      )}
    </>
  );
}

// ─── Modal shell + field, matching the Expenses glass language ──

function GlassModal({ eyebrow, title, onClose, children, footer, maxWidth = 500 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,18,36,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 32, width: '100%', maxWidth, boxShadow: '0 32px 64px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
        <div style={{ padding: '28px 36px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(96,165,250,0.8)', marginBottom: 4 }}>{eyebrow}</p>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <MdClose size={20} />
          </button>
        </div>
        <div style={{ padding: '24px 36px' }}>{children}</div>
        <div style={{ padding: '4px 36px 32px', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>{footer}</div>
      </div>
    </div>
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

const fieldInput = { background: 'transparent', border: 'none', color: '#fff', fontSize: 15, fontWeight: 500, outline: 'none', width: '100%', padding: '14px 16px' };

const cancelBtn = { background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '12px 22px', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const saveBtn = (saving) => ({ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', padding: '12px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(99,102,241,0.4)', opacity: saving ? 0.7 : 1 });

// Kept separate so typing in the form doesn't re-render the whole tree behind it
function SectionFormModal({ editId, initialForm, courses, onClose, onSave, saving }) {
  const [form, setForm] = useState(initialForm);
  // True once the user manually types in the title field.
  // For edits the title is already set, so treat it as manually edited from the start
  // so we never silently clobber what they saved before.
  const [titleEdited, setTitleEdited] = useState(!!editId);

  // Auto-fills (or updates) the title whenever the course changes — as long as
  // the user hasn't typed anything manually themselves.
  const handleCourse = (courseId) => {
    const course = courses.find((c) => c._id === courseId);
    setForm((f) => ({
      ...f,
      course: courseId,
      title: !titleEdited && course ? `${course.code} — ${course.name}` : f.title,
    }));
  };

  return (
    <GlassModal
      eyebrow={editId ? 'Edit Section' : 'New Section'}
      title={editId ? 'Modify Section' : 'Add a Course Section'}
      onClose={onClose}
      footer={<>
        <button onClick={onClose} style={cancelBtn}>Cancel</button>
        <button onClick={() => onSave(form)} disabled={saving} style={saveBtn(saving)}>
          {saving ? 'Saving...' : editId ? 'Apply Changes' : 'Add Section'}
        </button>
      </>}
    >
      <div style={{ marginBottom: 16 }}>
        <ModalField label="Course (optional)">
          <select value={form.course} onChange={(e) => handleCourse(e.target.value)} style={{ ...fieldInput, fontWeight: 600 }}>
            <option value="" style={{ background: '#1a2f5e' }}>Not linked to a course</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id} style={{ background: '#1a2f5e' }}>{c.code} — {c.name}</option>
            ))}
          </select>
        </ModalField>
      </div>
      <ModalField label="Title">
        <input
          type="text" autoFocus
          value={form.title}
          onChange={(e) => {
            setTitleEdited(true);
            setForm((f) => ({ ...f, title: e.target.value }));
          }}
          placeholder="e.g. CSE 4614 — Technical Report Writing"
          style={fieldInput}
        />
      </ModalField>
    </GlassModal>
  );
}

function SubsectionFormModal({ editId, initialForm, onClose, onSave, saving }) {
  const [form, setForm] = useState(initialForm);

  const PRIORITIES = [
    { value: 'none',   label: 'None',   color: '#94a3b8' },
    { value: 'low',    label: 'Low',    color: '#3b82f6' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high',   label: 'High',   color: '#ef4444' },
  ];

  return (
    <GlassModal
      eyebrow={editId ? 'Edit Subsection' : 'New Subsection'}
      title={editId ? 'Modify Subsection' : 'Add a Lecture or Task'}
      onClose={onClose}
      footer={<>
        <button onClick={onClose} style={cancelBtn}>Cancel</button>
        <button onClick={() => onSave(form)} disabled={saving} style={saveBtn(saving)}>
          {saving ? 'Saving...' : editId ? 'Apply Changes' : 'Add Subsection'}
        </button>
      </>}
    >
      <div style={{ marginBottom: 20 }}>
        <ModalField label="Title">
          <input
            type="text" autoFocus
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Lecture-3 (A-to-D Converters)"
            style={fieldInput}
          />
        </ModalField>
      </div>

      <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
        Priority
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {PRIORITIES.map((p) => {
          const active = form.priority === p.value;
          return (
            <button
              key={p.value}
              onClick={() => setForm((f) => ({ ...f, priority: p.value }))}
              style={{
                padding: '12px 8px', borderRadius: 14, cursor: 'pointer',
                background: active ? `${p.color}26` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${active ? p.color : 'rgba(255,255,255,0.1)'}`,
                color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </GlassModal>
  );
}
