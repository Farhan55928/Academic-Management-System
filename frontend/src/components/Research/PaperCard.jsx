import { Link } from 'react-router';
import { MdPictureAsPdf, MdArrowForward, MdDelete, MdRefresh, MdOpenInNew } from 'react-icons/md';

function StatusBadge({ status }) {
  const map = {
    pending:    { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', color: '#fbbf24', text: 'Pending' },
    generating: { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.3)',  color: '#93c5fd', text: 'Generating…' },
    ready:      { bg: 'rgba(34,197,94,0.15)',   border: 'rgba(34,197,94,0.3)',   color: '#86efac', text: 'Ready' },
    failed:     { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)',   color: '#fca5a5', text: 'Failed' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, padding: '4px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>
      {s.text}
    </span>
  );
}

function formatBytes(b) {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function PaperCard({ paper, onDelete, onRetry }) {
  const date = new Date(paper.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{
      background: '#fff',
      borderRadius: 24,
      boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
          <div style={{ background: 'linear-gradient(135deg, #1e3a6e, #1a2f5e)', borderRadius: 14, padding: 12, flexShrink: 0 }}>
            <MdPictureAsPdf size={22} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link to={`/research/${paper.researchProjectId}/papers/${paper._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {paper.title}
              </h4>
            </Link>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
              {paper.originalFilename} {paper.fileSizeBytes ? `· ${formatBytes(paper.fileSizeBytes)}` : ''} · {date}
            </p>
          </div>
        </div>
        <StatusBadge status={paper.summaryStatus} />
      </div>

      {paper.summaryStatus === 'failed' && paper.summaryError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: 12, fontSize: 12 }}>
          {paper.summaryError}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {paper.driveWebViewLink && (
            <a href={paper.driveWebViewLink} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: '#eff6ff', color: '#3b82f6', padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none',
            }}>
              <MdOpenInNew size={13} /> Drive
            </a>
          )}
          {paper.summaryStatus === 'failed' && onRetry && (
            <button onClick={() => onRetry(paper)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: '#fff5f5', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              <MdRefresh size={13} /> Retry
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onDelete && (
            <button onClick={() => onDelete(paper)} style={{
              background: '#fff5f5', color: '#ef4444', border: 'none', padding: '7px 10px', borderRadius: 10, cursor: 'pointer',
            }} title="Delete paper">
              <MdDelete size={14} />
            </button>
          )}
          <Link to={`/research/${paper.researchProjectId}/papers/${paper._id}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: '#1e293b', color: '#fff', padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none',
          }}>
            {paper.summaryStatus === 'ready' ? 'View Summary' : 'Open'} <MdArrowForward size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
