import { NavLink, Link } from 'react-router-dom';
import { Target, PanelLeftClose } from 'lucide-react';
import { NAV } from './navigation.js';
import Brand from './Brand.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Sidebar({ open = true, onClose = () => {} }) {
  const { user } = useAuth();
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-border z-40 flex flex-col transition-transform duration-200 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-7 pb-6">
          <Link to="/" aria-label="Spendly overview">
            <Brand />
          </Link>
          <button
            type="button"
            className="icon-button"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            onClick={onClose}
          >
            <PanelLeftClose size={20} />
          </button>
        </div>

        <p className="eyebrow px-6 mb-3">WORKSPACE</p>

        <nav
          aria-label="Main navigation"
          className="flex-1 px-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                'flex items-center gap-3 px-3 py-3 mb-1 rounded-btn text-sm font-medium transition-colors ' +
                (isActive ? 'bg-primary-tint text-primary' : 'text-text-secondary hover:bg-bg')
              }
            >
              <Icon size={19} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="m-4 p-4 rounded-card border border-border bg-bg">
          <Target size={22} className="text-primary mb-3" />
          <p className="font-semibold text-sm">Small steps. Bigger goals.</p>
          <p className="muted mt-2 leading-relaxed">Give your next big thing a little space in your budget.</p>
          <Link
            to="/goals"
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose();
            }}
            className="inline-block text-primary text-sm font-semibold mt-3"
          >
            Explore your goals
          </Link>
        </div>

        <Link
          to="/settings"
          onClick={() => {
            if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose();
          }}
          className="flex items-center gap-3 border-t border-border p-5 hover:bg-bg/50 transition-colors"
        >
          <span className="rounded-full bg-primary-tint text-primary w-10 h-10 flex items-center justify-center font-semibold shrink-0">
            {user?.name?.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{user?.name}</span>
            <span className="block text-xs text-text-secondary mt-1">Personal workspace</span>
          </span>
        </Link>
      </aside>
    </>
  );
}
