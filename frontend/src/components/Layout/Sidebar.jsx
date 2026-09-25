import { Link, useLocation } from 'react-router';
import { MdLogout, MdOutlineSchool, MdCircle } from 'react-icons/md';
import { NAV_LINKS, isNavActive } from './navLinks.js';

// Desktop-only navigation (hidden ≤768px, where Topbar + BottomNav take over).
export default function Sidebar({ user, activeSemester, onLogout }) {
  const location = useLocation();

  const initials = user?.email ? user.email[0].toUpperCase() : 'A';

  return (
    <aside className="sidebar anim-fade-in">
      {/* Brand */}
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="sidebar-brand-icon">
              <MdOutlineSchool color="#fff" size={20} />
            </div>
            <div>
              <h2 style={{ marginBottom: 1 }}>AcademiQ</h2>
              <p>Management System</p>
            </div>
          </div>
        </div>

        {activeSemester && (
          <div style={{
            marginTop: 16,
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div className="flex items-center gap-2 mb-1">
              <MdCircle size={8} color="var(--blue)" />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                Active Semester
              </span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>
              {activeSemester.name} {activeSemester.year}
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Navigation</span>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`sidebar-link ${isNavActive(location.pathname, link.to) ? 'active' : ''}`}
          >
            <link.Icon size={17} />
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <span className="sidebar-user-email">{user?.email || 'User'}</span>
          <button className="btn-logout" onClick={onLogout} title="Logout">
            <MdLogout size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
