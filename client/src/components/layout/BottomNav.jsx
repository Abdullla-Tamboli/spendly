import { NavLink } from 'react-router-dom';
import { NAV } from './navigation.js';
export default function BottomNav() {
  return <nav aria-label="Quick navigation" className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-border pb-[env(safe-area-inset-bottom)]"><div className="flex">{[NAV[0], NAV[1], NAV[4], NAV[7]].map(({ to, icon: Icon, label, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => 'flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium ' + (isActive ? 'text-primary bg-primary-tint/40' : 'text-text-secondary')}><Icon size={20} />{label}</NavLink>)}</div></nav>;
}
