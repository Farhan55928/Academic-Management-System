import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  MdDashboard, MdCalendarViewMonth, MdLogout,
  MdOutlineSchool, MdCircle, MdAccountBalanceWallet, MdMenuBook,
  MdMenu, MdClose,
} from 'react-icons/md';
import { getSemesters } from '../../api/semesters.js';

export default function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSemester, setActiveSemester] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    getSemesters().then(res => {
      const active = res.data.find(s => s.isActive) || res.data[0];
      setActiveSemester(active);
    }).catch(() => {});
  }, [location.pathname]);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const navLinks = [
    { to: '/',           label: 'Dashboard',     icon: <MdDashboard size={17} /> },
    { to: '/semesters',  label: 'Semesters',     icon: <MdCalendarViewMonth size={17} /> },
    { to: '/expenses',   label: 'Expense Log',   icon: <MdAccountBalanceWallet size={17} /> },
    { to: '/study',      label: 'Study Log',     icon: <MdMenuBook size={17} /> },
  ];

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const handleLogout = () => { onLogout(); navigate('/login'); };

  const initials = user?.email ? user.email[0].toUpperCase() : 'A';

  const sidebarContent = (
    <>
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
          {/* Close button — mobile only */}
          <button
            className="sidebar-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <MdClose size={22} color="rgba(255,255,255,0.7)" />
          </button>
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
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`sidebar-link ${isActive(link.to) ? 'active' : ''}`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <span className="sidebar-user-email">{user?.email || 'User'}</span>
          <button className="btn-logout" onClick={handleLogout} title="Logout">
            <MdLogout size={18} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile top bar ─────────────────── */}
      <div className="mobile-topbar">
        <button
          className="mobile-hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <MdMenu size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="sidebar-brand-icon" style={{ width: 28, height: 28 }}>
            <MdOutlineSchool color="#fff" size={16} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--navy)' }}>AcademiQ</span>
        </div>
        <div className="sidebar-avatar" style={{ width: 30, height: 30, fontSize: 12 }}>{initials}</div>
      </div>

      {/* ── Desktop sidebar ────────────────── */}
      <aside className="sidebar anim-fade-in">
        {sidebarContent}
      </aside>

      {/* ── Mobile overlay backdrop ─────────── */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ───────────────────── */}
      <aside className={`sidebar sidebar-drawer ${mobileOpen ? 'sidebar-drawer-open' : ''}`}>
        {sidebarContent}
      </aside>
    </>
  );
}
