import { NavLink, Link } from 'react-router-dom';
import { Target } from 'lucide-react';
import { NAV } from './navigation.js';
import Brand from './Brand.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Sidebar() {
  const { user } = useAuth();
  return <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-border z-30">
    <Link to="/" className="px-7 pt-8 pb-9" aria-label="Spendly overview"><Brand /></Link>
    <p className="eyebrow px-7 mb-3">WORKSPACE</p>
    <nav aria-label="Main navigation" className="flex-1 px-4 overflow-y-auto">
      {NAV.map(({ to, icon: Icon, label, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => 'flex items-center gap-3 px-3 py-3 mb-1 rounded-btn text-sm font-medium transition-colors ' + (isActive ? 'bg-primary-tint text-primary' : 'text-text-secondary hover:bg-bg')}><Icon size={19} strokeWidth={1.8} />{label}</NavLink>)}
    </nav>
    <div className="m-4 p-4 rounded-card border border-border bg-bg"><Target size={22} className="text-primary mb-3" /><p className="font-semibold text-sm">Small steps. Bigger goals.</p><p className="muted mt-2 leading-relaxed">Give your next big thing a little space in your budget.</p><Link to="/goals" className="inline-block text-primary text-sm font-semibold mt-3">Explore your goals</Link></div>
    <Link to="/settings" className="flex items-center gap-3 border-t border-border p-5"><span className="rounded-full bg-primary-tint text-primary w-10 h-10 flex items-center justify-center font-semibold shrink-0">{user?.name?.slice(0, 1).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{user?.name}</span><span className="block text-xs text-text-secondary mt-1">Personal workspace</span></span></Link>
  </aside>;
}
