import { Link } from 'react-router';

/**
 * Topbar — floating glass pill at the top of the mobile layout.
 *
 * Hidden on ≥768px (the desktop sidebar takes over navigation).
 *
 * Props:
 *   - title:        primary title (e.g. "Dashboard")
 *   - eyebrow:      small uppercase label above the title (e.g. "Active • Sem 4 Fall 2025")
 *   - to:           optional route — if set, the title becomes a link
 *   - left:         slot for left-side control (typically the hamburger)
 *   - right:        slot for right-side actions
 *   - onMenuOpen:   if set, renders the built-in hamburger button on the left
 */
export default function Topbar({ title, eyebrow, to, left, right, onMenuOpen }) {
  return (
    <header className="topbar" role="banner">
      {left ?? (
        onMenuOpen ? (
          <button
            type="button"
            className="hamburger"
            onClick={onMenuOpen}
            aria-label="Open navigation menu"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        ) : null
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow && <span className="topbar-eyebrow">{eyebrow}</span>}
        {to ? (
          <Link to={to} className="topbar-title" style={{ display: 'block' }}>
            {title}
          </Link>
        ) : (
          <div className="topbar-title">{title}</div>
        )}
      </div>

      {right && <div className="topbar-actions">{right}</div>}
    </header>
  );
}
