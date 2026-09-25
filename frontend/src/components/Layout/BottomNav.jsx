import { Link, useLocation } from 'react-router';
import { NAV_LINKS, isNavActive } from './navLinks.js';

// Mobile-only thumb-reach tab bar (hidden >768px via CSS).
export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {NAV_LINKS.map((link) => {
        const active = isNavActive(pathname, link.to);
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`bottom-nav-link ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="bottom-nav-icon"><link.Icon size={22} /></span>
            <span className="bottom-nav-label">{link.short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
