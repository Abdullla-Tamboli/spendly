import ProgressBar from './ProgressBar.jsx';
import useCurrency from '../../hooks/useCurrency.js';
export default function BudgetProgress({ budget, compact = false }) {
  const money = useCurrency();
  const limit = budget.overall ?? budget.amount;
  const color = ['danger', 'exceeded'].includes(budget.level) ? 'text-expense bg-expense-tint' : budget.level === 'warning' ? 'text-warning bg-warning-tint' : 'text-primary bg-primary-tint';
  const message = budget.level === 'exceeded' ? 'Budget exceeded by ' + money(Math.max(0, budget.spent - limit)) + '.' : budget.message;
  return <div className="space-y-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><p><span className="text-2xl font-semibold tabular-nums">{money(budget.spent)}</span><span className="text-sm text-text-secondary"> of {money(limit)}</span></p><span className="text-sm font-semibold tabular-nums">{budget.percentUsed}% used</span></div><ProgressBar value={budget.percentUsed} level={budget.level} label="Budget used" /><div className="flex justify-between gap-3 text-sm"><span className="text-text-secondary">{budget.remaining < 0 ? 'Over budget' : 'Remaining'}</span><span className="font-semibold tabular-nums">{money(Math.abs(budget.remaining))}</span></div>{!compact && <p className={'rounded-btn px-3 py-3 text-sm leading-relaxed ' + color}>{message}</p>}</div>;
}
