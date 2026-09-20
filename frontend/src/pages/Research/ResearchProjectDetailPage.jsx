import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { MdArrowBack, MdAdd, MdEdit, MdDelete, MdArticle, MdCheckCircle } from 'react-icons/md';
import toast from 'react-hot-toast';
import {
  getPapers, getProjects, createProject, updateProject, deleteProject,
  regenerateSummary, deletePaper,
} from '../../api/research.js';
import { errorMessage } from '../../api/errors.js';
import PaperCard from '../../components/Research/PaperCard.jsx';
import ProjectModal from '../../components/Research/ProjectModal.jsx';
import UploadPaperModal from '../../components/Research/UploadPaperModal.jsx';

export default function ResearchProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [projectsRes, papersRes] = await Promise.all([
        getProjects(),
        getPapers(projectId),
      ]);
      const p = projectsRes.data.find(x => x._id === projectId);
      if (!p) {
        toast.error('Project not found');
        navigate('/research');
        return;
      }
      setProject(p);
      setPapers(papersRes.data);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to load project'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [projectId, navigate]);

  // Keep the latest load in a ref so the polling effect doesn't need it
  // as a dep (otherwise papers → load (new ref) → effect tears down +
  // re-creates the interval every tick, and setLoading(true) on each
  // tick causes a visible full-page reload flicker).
  const loadRef = useRef(load);
  loadRef.current = load;

  // Poll while any paper is still generating — the server is doing real
  // work (PDF download + text extraction + LLM call) which can take 30–60s.
  // Re-runs only when `papers` changes, not on every render.
  useEffect(() => {
    const stillWorking = papers.some(
      p => p.summaryStatus === 'pending' || p.summaryStatus === 'generating'
    );
    if (!stillWorking) return;
    const t = setInterval(() => loadRef.current({ silent: true }), 3000);
    return () => clearInterval(t);
  }, [papers]);

  useEffect(() => { load(); }, [load]);

  const handleEdit = async (data) => {
    await updateProject(projectId, data);
    toast.success('Project updated');
    setEditModal(false);
    load();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${project.name}" and ALL its papers? PDFs will be removed from your Drive too.`)) return;
    try {
      await deleteProject(projectId);
      toast.success('Project deleted');
      navigate('/research');
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to delete'));
    }
  };

  const handleUploaded = async (newPaper) => {
    toast.success('Uploaded — generating summary…');
    setUploadModal(false);
    await load();
  };

  const handleDeletePaper = async (paper) => {
    if (!confirm(`Delete "${paper.title}"? PDF will be removed from your Drive.`)) return;
    try {
      await deletePaper(paper._id);
      toast.success('Paper removed');
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to delete'));
    }
  };

  const handleRetrySummary = async (paper) => {
    try {
      await regenerateSummary(paper._id);
      toast.success('Regenerating summary…');
      setTimeout(load, 500);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to retry'));
    }
  };

  if (loading || !project) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f4f9' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading project...</p>
        </div>
      </div>
    );
  }

  const ready = papers.filter(p => p.summaryStatus === 'ready').length;
  const generating = papers.filter(p => p.summaryStatus === 'pending' || p.summaryStatus === 'generating').length;
  const projectColor = project.color || '#1e3a6e';

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f9' }}>
      {/* Hero */}
      <div className="hero-section" style={{
        background: `linear-gradient(135deg, ${projectColor} 0%, #0f1e3c 100%)`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/research" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
            <MdArrowBack size={16} /> Back to Research Logs
          </Link>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.25em', color: 'rgba(96,165,250,0.9)', textTransform: 'uppercase', marginBottom: 10 }}>
            Research Project
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 900, color: '#fff', margin: 0 }}>
                {project.name}
              </h1>
              {project.description && (
                <p style={{ color: 'rgba(255,255,255,0.65)', marginTop: 8, fontSize: 15, maxWidth: 700 }}>{project.description}</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setEditModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '12px 20px', borderRadius: 16, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                <MdEdit size={17} /> Edit
              </button>
              <button
                onClick={handleDelete}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fff', padding: '12px 20px', borderRadius: 16, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                <MdDelete size={17} /> Delete
              </button>
              <button
                onClick={() => setUploadModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', padding: '12px 20px', borderRadius: 16, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(59,130,246,0.4)' }}
              >
                <MdAdd size={18} /> Upload Paper
              </button>
            </div>
          </div>

          <div className="stats-grid" style={{ marginTop: 32 }}>
            {[
              { label: 'Total Papers', value: papers.length,  icon: <MdArticle size={22} color="rgba(96,165,250,0.8)" /> },
              { label: 'Summarized',    value: ready,          icon: <MdCheckCircle size={22} color="rgba(34,197,94,0.8)" /> },
              { label: 'In Progress',   value: generating,     icon: '⏳' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '18px 22px', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 16 }}>
                {typeof s.icon === 'string' ? <div style={{ fontSize: 22 }}>{s.icon}</div> : s.icon}
                <div>
                  <p style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '3px 0 0' }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="content-section" style={{ marginTop: -32, position: 'relative', zIndex: 1 }}>
        {papers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>No Papers Yet</h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Upload your first PDF — it'll be saved to Drive and summarized automatically.</p>
            <button onClick={() => setUploadModal(true)} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', padding: '11px 24px', borderRadius: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Upload Paper
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {papers.map((paper) => (
              <PaperCard
                key={paper._id}
                paper={paper}
                onDelete={handleDeletePaper}
                onRetry={handleRetrySummary}
              />
            ))}
          </div>
        )}
      </div>

      {editModal && (
        <ProjectModal
          project={project}
          onClose={() => setEditModal(false)}
          onSave={handleEdit}
        />
      )}
      {uploadModal && (
        <UploadPaperModal
          projectId={projectId}
          onClose={() => setUploadModal(false)}
          onUploaded={handleUploaded}
        />
      )}
    </div>
  );
}
