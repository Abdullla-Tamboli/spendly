import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CalendarDays, Menu, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { NAV } from './navigation.js';
import Brand from './Brand.jsx';
import Modal from '../ui/Modal.jsx';

export default function TopBar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  return <header className="bg-white border-b border-border px-4 sm:px-6 lg:px-8 min-h-20 flex items-center justify-between gap-3">
    <div className="flex items-center gap-3"><button type="button" className="icon-button lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu size={22} /></button><span className="lg:hidden"><Brand /></span><div className="hidden lg:flex gap-2 items-center text-sm text-text-secondary"><span>My workspace</span><span className="text-text-muted">/</span><span className="font-medium text-text-primary">{NAV.find((n) => n.to === pathname)?.label || 'Overview'}</span></div></div>
    <div className="flex items-center gap-4"><Link to="/transactions" className="hidden md:flex items-center gap-2 text-text-secondary text-sm hover:text-primary"><Search size={17} />Find a transaction</Link><span className="hidden xl:flex border-l border-border pl-4 items-center gap-2 text-sm text-text-secondary"><CalendarDays size={17} />{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())}</span><Link to="/settings" aria-label="Profile and settings" className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-tint text-primary text-sm font-semibold">{user?.name?.[0]?.toUpperCase()}</Link></div>
    <Modal title="Your workspace" open={open} onClose={() => setOpen(false)}><nav aria-label="Mobile navigation" className="grid grid-cols-2 gap-2">{NAV.map(({ to, icon: Icon, label, end }) => <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => 'flex flex-col gap-3 rounded-btn p-4 text-sm ' + (isActive ? 'bg-primary-tint text-primary' : 'bg-bg text-text-secondary')}><Icon size={22} />{label}</NavLink>)}</nav></Modal>
  </header>;
}
