import { useState } from 'react';
import { Link } from 'react-router';
import { MdArrowForward } from 'react-icons/md';

/**
 * Project card for Research Logs.
 *
 * Aesthetic: "specimen tag / scientific archive." Off-white paper surface,
 * serif display name + academic mono metadata, single colored tab on the
 * left edge pulled from the project's chosen color. The tab also hosts the
 * delete control — it appears on hover as a subtle X.
 *
 * The previous version was a flat dark gradient with a generic folder
 * icon; this one reads as a library catalog card and gives each project
 * a typographic identity via its monogram.
 */

// Display face — Fraunces has the editorial, slightly off-axis serif feel
// we want for "research paper" content. Loaded via Google Fonts in index.html.
// (If the font isn't loaded, the CSS fallback chain still produces a
// dignified serif instead of a generic sans.)
function Monogram({ name, color }) {
  const initials = name
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '·';
  return (
    <span
      aria-hidden
      style={{
        fontFamily: "'Fraunces', 'IBM Plex Serif', Georgia, serif",
        fontWeight: 900,
        fontSize: 28,
        lineHeight: 1,
        color: color,
        letterSpacing: '-0.02em',
        fontVariationSettings: '"SOFT" 50, "WONK" 1',
      }}
    >
      {initials}
    </span>
  );
}

export default function ProjectCard({ project, onDelete }) {
  const color = project.color || '#1e3a6e';
  const [hover, setHover] = useState(false);

  const paperCount = project.paperCount || 0;
  const lastUpload = project.lastUploadAt
    ? new Date(project.lastUploadAt).toLocaleDateString('en-US', {
        month: 'short', day: '2-digit', year: 'numeric',
      }).toUpperCase()
    : '— EMPTY —';

  // Stable short id (last 6 chars of the mongo _id) — gives the card the
  // "catalog number" feel without exposing the full id.
  const catalogId = (project._id || '').slice(-6).toUpperCase();

  return (
    <Link
      to={`/research/${project._id}`}
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <article
        style={{
          position: 'relative',
          background: '#fbfaf5', // warm paper-cream, reads against #f0f4f9 page
          color: '#1a1a1a',
          borderRadius: 4, // editorial cards have crisp corners
          padding: '0 0 0 0',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'transform 0.35s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.35s ease',
          transform: hover ? 'translateY(-3px)' : 'translateY(0)',
          boxShadow: hover
            ? '0 14px 32px -12px rgba(15,30,60,0.18), 0 2px 4px rgba(15,30,60,0.04)'
            : '0 2px 8px -2px rgba(15,30,60,0.08)',
          // Subtle paper-grain noise so it doesn't feel like a flat fill.
          backgroundImage: `
            radial-gradient(circle, rgba(30,58,110,0.045) 1px, transparent 1px),
            linear-gradient(180deg, #fbfaf5 0%, #f5f1e6 100%)
          `,
          backgroundSize: '6px 6px, 100% 100%',
          backgroundPosition: '0 0, 0 0',
        }}
      >
        {/* Left-edge colored tab — printed band, not a gradient blob */}
        <div
          aria-hidden
          style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 6,
            background: color,
          }}
        />
        {/* Faint horizontal rule under the header, like a library card */}
        <div
          aria-hidden
          style={{
            position: 'absolute', left: 22, right: 22, top: 86,
            height: 1, background: 'rgba(15,30,60,0.18)',
          }}
        />

        {/* Header row: monogram + catalog number */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '20px 22px 14px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#fff',
              border: `1.5px solid ${color}`,
              borderRadius: 2,
              boxShadow: 'inset 0 0 0 3px #fbfaf5, 0 1px 0 rgba(15,30,60,0.05)',
            }}>
              <Monogram name={project.name} color={color} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{
                fontFamily: "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace",
                fontSize: 9.5,
                letterSpacing: '0.18em',
                color: 'rgba(15,30,60,0.55)',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}>
                Research Project
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace",
                fontSize: 10,
                color: 'rgba(15,30,60,0.35)',
                letterSpacing: '0.08em',
              }}>
                № {catalogId}
              </span>
            </div>
          </div>

          {/* Delete control — sits on the colored tab, fades in on hover */}
          {onDelete && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(project); }}
              title="Delete project"
              aria-label="Delete project"
              style={{
                position: 'absolute', top: 10, left: 10,
                width: 22, height: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(15,30,60,0.0)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                lineHeight: 1,
                opacity: hover ? 0.85 : 0,
                transition: 'opacity 0.2s ease, background 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15,30,60,0.0)'; }}
            >
              ×
            </button>
          )}
        </div>

        {/* Title + description */}
        <div style={{ padding: '4px 22px 16px 22px' }}>
          <h3 style={{
            fontFamily: "'Fraunces', 'IBM Plex Serif', Georgia, serif",
            fontSize: 26,
            fontWeight: 600,
            color: '#0f1e3c',
            margin: 0,
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
            // Subtle italic optical adjustment — feels more editorial
            fontStyle: 'normal',
          }}>
            {project.name}
          </h3>
          {project.description && (
            <p style={{
              fontFamily: "'Fraunces', 'IBM Plex Serif', Georgia, serif",
              fontSize: 13.5,
              color: 'rgba(15,30,60,0.62)',
              margin: '8px 0 0',
              lineHeight: 1.45,
              fontStyle: 'italic',
            }}>
              {project.description.length > 110
                ? project.description.slice(0, 110) + '…'
                : project.description}
            </p>
          )}
        </div>

        {/* Metadata row — academic mono */}
        <div style={{
          padding: '14px 22px 18px 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12,
          borderTop: '1px solid rgba(15,30,60,0.08)',
          marginTop: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9, letterSpacing: '0.16em',
                color: 'rgba(15,30,60,0.45)', textTransform: 'uppercase',
              }}>
                Papers
              </span>
              <span style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 22, fontWeight: 600, color: '#0f1e3c',
                lineHeight: 1.1, marginTop: 2,
                fontVariationSettings: '"SOFT" 30',
              }}>
                {String(paperCount).padStart(2, '0')}
              </span>
            </div>
            <div style={{
              width: 1, height: 28,
              background: 'rgba(15,30,60,0.15)',
            }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9, letterSpacing: '0.16em',
                color: 'rgba(15,30,60,0.45)', textTransform: 'uppercase',
              }}>
                Updated
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11, fontWeight: 500,
                color: '#0f1e3c', marginTop: 6,
                letterSpacing: '0.02em',
              }}>
                {lastUpload}
              </span>
            </div>
          </div>

          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: hover ? color : 'rgba(15,30,60,0.55)',
            transition: 'color 0.2s ease',
          }}>
            Open
            <MdArrowForward size={14} style={{ transition: 'transform 0.25s ease', transform: hover ? 'translateX(3px)' : 'translateX(0)' }} />
          </span>
        </div>
      </article>
    </Link>
  );
}
