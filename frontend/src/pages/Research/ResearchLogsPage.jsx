import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { MdAdd, MdCloud, MdCheckCircle } from 'react-icons/md';
import toast from 'react-hot-toast';
import {
  getProjects, createProject, deleteProject, getPapers,
  redirectToGoogleConnect,
} from '../../api/research.js';
import { getMe } from '../../api/auth.js';
import { errorMessage } from '../../api/errors.js';
import ProjectCard from '../../components/Research/ProjectCard.jsx';
import ProjectModal from '../../components/Research/ProjectModal.jsx';
import PaperCard from '../../components/Research/PaperCard.jsx';

export default function ResearchLogsPage() {
  const [search] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [modal, setModal] = useState(false);

  // Toast on return from Google OAuth
  useEffect(() => {
    const drive = search.get('drive');
    if (drive === 'connected')        toast.success('Google Drive connected!');
    else if (drive === 'invalid_state')    toast.error('Auth session expired. Try again.');
    else if (drive === 'exchange_failed')  toast.error('Could not connect Google Drive.');
    else if (drive === 'no_access_token')  toast.error('Google did not return a token.');
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, projectsRes, papersRes] = await Promise.all([
        getMe(),
        getProjects(),
        getPapers(),
      ]);
      setUser(meRes.data);
      setProjects(projectsRes.data);
      setPapers(papersRes.data);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to load Research Logs'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    await createProject(data);
    toast.success('Project created');
    setModal(false);
    load();
  };

  const handleDelete = async (project) => {
    if (!confirm(`Delete "${project.name}" and ALL its papers? This also removes the PDFs from your Drive.`)) return;
    try {
      await deleteProject(project._id);
      toast.success('Project deleted');
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to delete'));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f4f9' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading research logs...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalProjects: projects.length,
    totalPapers:    papers.length,
    ready:          papers.filter(p => p.summaryStatus === 'ready').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f9' }}>
      {/* Hero */}
      <div className="hero-section" style={{
        background: 'linear-gradient(135deg, #0f1e3c 0%, #1a2f5e 60%, #1e3a6e 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.25em', color: 'rgba(96,165,250,0.9)', textTransform: 'uppercase', marginBottom: 12 }}>
            Paper Intelligence
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1 }}>
                Research Logs
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 8, fontSize: 15 }}>
                Upload papers to your Google Drive, get AI summaries automatically.
              </p>
            </div>
            <button
              onClick={() => setModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', padding: '14px 24px', borderRadius: 18, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(59,130,246,0.4)' }}
            >
              <MdAdd size={20} /> New Project
            </button>
          </div>

          <div className="stats-grid" style={{ marginTop: 36 }}>
            {[
              { label: 'Projects',  value: stats.totalProjects, icon: '📚' },
              { label: 'Papers',    value: stats.totalPapers,   icon: '📄' },
              { label: 'Summarized', value: stats.ready,        icon: '✨' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '20px 24px', backdropFilter: 'blur(12px)',
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0 }}>{s.value}</p>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="content-section" style={{ marginTop: -40, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Drive connection banner */}
        {!user?.googleConnected && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 24, padding: '22px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ background: 'rgba(245,158,11,0.2)', borderRadius: 12, padding: 12 }}>
                <MdCloud size={22} color="#fbbf24" />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 800, color: '#92400e', fontSize: 15 }}>Connect Google Drive to upload PDFs</p>
                <p style={{ margin: '4px 0 0', color: '#a16207', fontSize: 13 }}>
                  Papers are saved to your personal Drive — never to our servers.
                </p>
              </div>
            </div>
            <button
              onClick={redirectToGoogleConnect}
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: '#fff', padding: '10px 22px', borderRadius: 14, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 6px 18px rgba(245,158,11,0.35)' }}
            >
              Connect Drive
            </button>
          </div>
        )}

        {user?.googleConnected && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 16, padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 10, color: '#15803d', fontSize: 13, fontWeight: 600,
          }}>
            <MdCheckCircle size={18} /> Google Drive connected
          </div>
        )}

        {/* Projects grid */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            marginBottom: 22, paddingBottom: 14,
            borderBottom: '1px solid rgba(15,30,60,0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <h2 style={{
                fontFamily: "'Fraunces', 'IBM Plex Serif', Georgia, serif",
                fontSize: 28, fontWeight: 600, color: '#0f1e3c', margin: 0,
                letterSpacing: '-0.01em', fontVariationSettings: '"SOFT" 50',
              }}>
                Your Projects
              </h2>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12, color: 'rgba(15,30,60,0.5)', letterSpacing: '0.04em',
                fontWeight: 500,
              }}>
                {String(projects.length).padStart(2, '0')} on file
              </span>
            </div>
          </div>

          {projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🔬</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>No Projects Yet</h3>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Create your first research project to start organizing papers.</p>
              <button onClick={() => setModal(true)} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', padding: '12px 28px', borderRadius: 16, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
                Create Project
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {projects.map((p) => (
                <ProjectCard key={p._id} project={p} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>

        {/* Recent papers */}
        {papers.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>Recent Papers</h2>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>({papers.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {papers.slice(0, 10).map((paper) => (
                <PaperCard key={paper._id} paper={paper} />
              ))}
            </div>
          </div>
        )}
      </div>

      {modal && <ProjectModal onClose={() => setModal(false)} onSave={handleCreate} />}
    </div>
  );
}
