import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { MdArrowBack, MdLogout, MdOutlineSchool } from 'react-icons/md';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';
import Topbar from '../UI/Topbar.jsx';
import Sheet from '../UI/Sheet.jsx';
import { NAV_LINKS, isNavActive } from './navLinks.js';
import { getSemesters } from '../../api/semesters.js';

// Detail routes that have no nav entry of their own map to the closest section.
const SECTION_FALLBACK = { '/courses': 'Semesters' };

export default function Layout({ user, onLogout, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSemester, setActiveSemester] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    // Fetch once per mount — this used to re-run on every route change,
    // duplicating whatever the destination page was already fetching and
    // competing for the same (small, serverless) connection pool.
    getSemesters().then(res => {
      const active = res.data.find(s => s.isActive) || res.data[0];
      setActiveSemester(active);
    }).catch(() => {});
  }, []);

  useEffect(() => { setAccountOpen(false); }, [location.pathname]);

  const handleLogout = () => { onLogout(); navigate('/login'); };

  const { pathname } = location;
  const section = NAV_LINKS.find(l => isNavActive(pathname, l.to));
  const title = section?.label
    ?? Object.entries(SECTION_FALLBACK).find(([p]) => pathname.startsWith(p))?.[1]
    ?? 'AcademiQ';
  const isDetail = pathname.split('/').filter(Boolean).length > 1;

  const goBack = () => {
    // react-router stores the history index; idx 0 means we were deep-linked
    // here, so "back" would leave the app — go to the section root instead.
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate(section?.to ?? '/semesters');
  };

  const initials = user?.email ? user.email[0].toUpperCase() : 'A';

  return (
    <div className="app-layout">
      <Sidebar user={user} activeSemester={activeSemester} onLogout={handleLogout} />

      <Topbar
        title={title}
        eyebrow={activeSemester ? `${activeSemester.name} ${activeSemester.year}` : 'AcademiQ'}
        left={isDetail ? (
          <button type="button" className="topbar-icon-btn" onClick={goBack} aria-label="Go back">
            <MdArrowBack size={22} />
          </button>
        ) : (
          <div className="topbar-brand" aria-hidden="true">
            <MdOutlineSchool size={18} />
          </div>
        )}
        right={
          <button
            type="button"
            className="topbar-avatar"
            onClick={() => setAccountOpen(true)}
            aria-label="Account"
          >
            {initials}
          </button>
        }
      />

      <main className="main-content">
        {children}
      </main>

      <BottomNav />

      <Sheet open={accountOpen} onClose={() => setAccountOpen(false)} title="Account">
        <div className="account-sheet-user">
          <div className="sidebar-avatar" style={{ width: 44, height: 44, fontSize: 17 }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <p className="account-sheet-email">{user?.email || 'User'}</p>
            {activeSemester && (
              <p className="account-sheet-meta">Active · {activeSemester.name} {activeSemester.year}</p>
            )}
          </div>
        </div>
        <button type="button" className="account-sheet-logout" onClick={handleLogout}>
          <MdLogout size={19} /> Log out
        </button>
      </Sheet>
    </div>
  );
}
