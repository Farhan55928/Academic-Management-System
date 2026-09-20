import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { MdArrowBack, MdDelete, MdOpenInNew, MdRefresh, MdPictureAsPdf } from 'react-icons/md';
import toast from 'react-hot-toast';
import { getPaperById, deletePaper, regenerateSummary } from '../../api/research.js';
import { errorMessage } from '../../api/errors.js';
import SummaryView from '../../components/Research/SummaryView.jsx';

export default function ResearchPaperPage() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getPaperById(paperId);
      setPaper(res.data);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to load paper'));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [paperId]);

  // Poll every 3s while generating — the LLM call can take 30–60s.
  useEffect(() => {
    if (!paper) return;
    const working = paper.summaryStatus === 'pending' || paper.summaryStatus === 'generating';
    if (working && !pollRef.current) {
      pollRef.current = setInterval(() => load(true), 3000);
    }
    if (!working && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [paper]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!confirm(`Delete "${paper.title}"? PDF will be removed from your Drive.`)) return;
    try {
      await deletePaper(paperId);
      toast.success('Paper removed');
      navigate(`/research/${paper.researchProjectId}`);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to delete'));
    }
  };

  const handleRetry = async () => {
    try {
      await regenerateSummary(paperId);
      toast.success('Regenerating summary…');
      load(true);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to retry'));
    }
  };

  if (loading || !paper) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f4f9' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading paper...</p>
        </div>
      </div>
    );
  }

  const isWorking = paper.summaryStatus === 'pending' || paper.summaryStatus === 'generating';
  const isFailed  = paper.summaryStatus === 'failed';
  const isReady   = paper.summaryStatus === 'ready';

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f9' }}>
      {/* Compact header */}
      <div style={{ background: 'linear-gradient(135deg, #0f1e3c 0%, #1a2f5e 60%, #1e3a6e 100%)', padding: '28px 32px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto' }}>
          <Link to={`/research/${paper.researchProjectId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            <MdArrowBack size={16} /> Back to project
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 14 }}>
              <MdPictureAsPdf size={28} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(96,165,250,0.9)', textTransform: 'uppercase', margin: '0 0 4px' }}>
                Research Paper
              </p>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.2 }}>
                {paper.title}
              </h1>
              <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                {paper.originalFilename} · {new Date(paper.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {paper.driveWebViewLink && (
                <a href={paper.driveWebViewLink} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                  padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: 'none',
                }}>
                  <MdOpenInNew size={14} /> Open in Drive
                </a>
              )}
              {isFailed && (
                <button onClick={handleRetry} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24',
                  padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>
                  <MdRefresh size={14} /> Retry
                </button>
              )}
              <button onClick={handleDelete} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5',
                padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
                <MdDelete size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 32px 60px' }}>
        {isWorking && (
          <div style={{ background: '#fff', borderRadius: 24, padding: '60px 32px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <div style={{ width: 48, height: 48, border: '4px solid #dbeafe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>Generating Summary</h3>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
              {paper.summaryStatus === 'pending' ? 'Queued — starting soon…' : 'Reading PDF and asking Gemini…'}
            </p>
            <p style={{ color: '#94a3b8', fontSize: 12, margin: '12px 0 0' }}>This usually takes 20–60 seconds.</p>
          </div>
        )}

        {isFailed && (
          <div style={{ background: '#fff', borderRadius: 24, padding: '48px 32px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '2px solid #fecaca' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#991b1b', margin: '0 0 8px' }}>Summary Generation Failed</h3>
            <p style={{ color: '#7f1d1d', fontSize: 14, margin: '0 0 20px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
              {paper.summaryError || 'Something went wrong while generating the summary.'}
            </p>
            <button onClick={handleRetry} style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: '#fff', padding: '11px 26px', borderRadius: 14, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
              Try Again
            </button>
          </div>
        )}

        {isReady && paper.summaryMarkdown && (
          <SummaryView markdown={paper.summaryMarkdown} />
        )}
      </div>
    </div>
  );
}
