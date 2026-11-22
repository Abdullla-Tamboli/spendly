import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, PanelLeft, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { NAV } from './navigation.js';
import Brand from './Brand.jsx';

export default function TopBar({ sidebarOpen = true, onToggleSidebar = () => {} }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  return (
    <header className="bg-white border-b border-border px-4 sm:px-6 lg:px-8 min-h-20 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="icon-button"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          onClick={onToggleSidebar}
        >
          <PanelLeft size={21} />
        </button>
        <span className="lg:hidden">
          <Brand />
        </span>
        <div className="hidden lg:flex gap-2 items-center text-sm text-text-secondary">
          <span>My workspace</span>
          <span className="text-text-muted">/</span>
          <span className="font-medium text-text-primary">
            {NAV.find((n) => n.to === pathname)?.label || 'Overview'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link
          to="/transactions"
          className="hidden md:flex items-center gap-2 text-text-secondary text-sm hover:text-primary transition-colors"
        >
          <Search size={17} />
          Find a transaction
        </Link>
        <span className="hidden xl:flex border-l border-border pl-4 items-center gap-2 text-sm text-text-secondary">
          <CalendarDays size={17} />
          {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())}
        </span>
        <Link
          to="/settings"
          aria-label="Profile and settings"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-tint text-primary text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {user?.name?.[0]?.toUpperCase()}
        </Link>
      </div>
    </header>
  );
}
