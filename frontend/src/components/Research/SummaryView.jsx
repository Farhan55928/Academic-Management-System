import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renders an AI-generated paper summary. The summary follows the strict
 * Research Prompt.md structure, so we style headings/emojis prominently.
 * `remark-gfm` enables tables, strikethrough, and task lists — heavily
 * used in the template.
 */
export default function SummaryView({ markdown }) {
  if (!markdown) return null;

  return (
    <div
      className="markdown-body"
      style={{
        background: '#fff',
        borderRadius: 24,
        padding: '36px 44px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        color: '#1e293b',
        fontSize: 15,
        lineHeight: 1.7,
        fontFamily: 'var(--font-body)',
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Make H1 the paper title
          h1: ({ node, ...props }) => (
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 900, margin: '0 0 24px', color: '#0f172a' }} {...props} />
          ),
          // H2 sections (🧠 Paper Identity, ⭐ Priority Section, etc.)
          h2: ({ node, ...props }) => (
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 22, fontWeight: 800, margin: '40px 0 16px',
              paddingTop: 20, borderTop: '2px solid #e2e8f0',
              color: '#0f172a',
            }} {...props} />
          ),
          // H3 sub-sections inside Priority Section
          h3: ({ node, ...props }) => (
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 800, margin: '24px 0 10px', color: '#1e293b' }} {...props} />
          ),
          p: ({ node, ...props }) => <p style={{ margin: '0 0 12px' }} {...props} />,
          ul: ({ node, ...props }) => <ul style={{ margin: '0 0 16px', paddingLeft: 24 }} {...props} />,
          ol: ({ node, ...props }) => <ol style={{ margin: '0 0 16px', paddingLeft: 24 }} {...props} />,
          li: ({ node, ...props }) => <li style={{ marginBottom: 6 }} {...props} />,
          hr: ({ node, ...props }) => <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '28px 0' }} {...props} />,
          strong: ({ node, ...props }) => <strong style={{ fontWeight: 700, color: '#0f172a' }} {...props} />,
          a: ({ node, ...props }) => <a style={{ color: '#3b82f6', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" {...props} />,
          code: ({ node, inline, ...props }) =>
            inline
              ? <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 13, fontFamily: 'var(--font-mono, monospace)' }} {...props} />
              : <code style={{ display: 'block', background: '#0f172a', color: '#e2e8f0', padding: 14, borderRadius: 10, overflowX: 'auto', fontSize: 13, fontFamily: 'var(--font-mono, monospace)' }} {...props} />,
          table: ({ node, ...props }) => (
            <div style={{ overflowX: 'auto', margin: '16px 0 20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }} {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th style={{ background: '#1e293b', color: '#fff', padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }} {...props} />
          ),
          td: ({ node, ...props }) => (
            <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' }} {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote style={{ margin: '12px 0', padding: '10px 16px', background: '#f8fafc', borderLeft: '4px solid #3b82f6', color: '#475569', borderRadius: '0 8px 8px 0' }} {...props} />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
