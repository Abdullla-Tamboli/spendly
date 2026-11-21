import { LayoutDashboard, ArrowLeftRight, ChartNoAxesCombined, Wallet, PiggyBank, Repeat2, Target, Settings } from 'lucide-react';
export const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/analytics', icon: ChartNoAxesCombined, label: 'Analytics' },
  { to: '/accounts', icon: Wallet, label: 'Accounts' },
  { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { to: '/recurring', icon: Repeat2, label: 'Recurring' },
  { to: '/goals', icon: Target, label: 'Savings goals' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];
