import {
  MdDashboard, MdCalendarViewMonth, MdAccountBalanceWallet, MdMenuBook, MdChecklist,
} from 'react-icons/md';

// Shared by the desktop Sidebar and the mobile BottomNav so the two never drift.
// `short` is the label used in the space-constrained bottom tab bar.
export const NAV_LINKS = [
  { to: '/',          label: 'Dashboard',   short: 'Home',      Icon: MdDashboard },
  { to: '/semesters', label: 'Semesters',   short: 'Semesters', Icon: MdCalendarViewMonth },
  { to: '/backlog',   label: 'Backlog',     short: 'Backlog',   Icon: MdChecklist },
  { to: '/expenses',  label: 'Expense Log', short: 'Expenses',  Icon: MdAccountBalanceWallet },
  { to: '/study',     label: 'Study Log',   short: 'Study',     Icon: MdMenuBook },
];

export const isNavActive = (pathname, to) =>
  to === '/' ? pathname === '/' : pathname.startsWith(to);
