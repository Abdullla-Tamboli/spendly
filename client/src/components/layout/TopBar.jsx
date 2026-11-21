import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/analytics': 'Analytics',
  '/accounts': 'Accounts',
  '/budgets': 'Budgets',
  '/recurring': 'Recurring',
  '/goals': 'Goals',
  '/settings': 'Settings',
};

export default function TopBar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const title = PAGE_TITLES[pathname] || 'Spendly';

  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-border px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* Mobile logo */}
        <span className="text-lg font-bold text-primary lg:hidden">Spendly</span>
        <h1 className="hidden lg:block text-base font-semibold text-text-primary">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm text-text-secondary hidden sm:block">{user?.name}</div>
        <div className="h-8 w-8 rounded-full bg-primary-tint flex items-center justify-center text-primary font-semibold text-sm">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
