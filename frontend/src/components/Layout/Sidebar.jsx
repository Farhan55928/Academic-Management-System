import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  MdDashboard, MdCalendarViewMonth, MdLogout,
  MdOutlineSchool, MdCircle, MdAccountBalanceWallet, MdMenuBook
} from 'react-icons/md';
import { getSemesters } from '../../api/semesters.js';

export default function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSemester, setActiveSemester] = useState(null);

  useEffect(() => {
    getSemesters().then(res => {
      const active = res.data.find(s => s.isActive) || res.data[0];
      setActiveSemester(active);
    }).catch(() => {});
  }, [location.pathname]); // Re-check on nav

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

  return (
    <aside className="sidebar anim-fade-in">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <MdOutlineSchool color="#fff" size={20} />
        </div>
        <h2>AcademiQ</h2>
        <p>Management System</p>
        
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
    </aside>
  );
}
