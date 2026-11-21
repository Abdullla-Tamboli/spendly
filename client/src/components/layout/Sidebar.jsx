import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, BarChart2,
  Wallet, PiggyBank, RefreshCw, Target, Settings,
} from 'lucide-react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/accounts', icon: Wallet, label: 'Accounts' },
  { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { to: '/recurring', icon: RefreshCw, label: 'Recurring' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-surface border-r border-border z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <span className="text-xl font-bold text-primary">Spendly</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-3">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-tint text-primary'
                      : 'text-text-secondary hover:bg-bg hover:text-text-primary'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
