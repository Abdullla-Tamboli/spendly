const LEVEL_COLORS = {
  ok: 'bg-income',
  info: 'bg-primary',
  warning: 'bg-warning',
  danger: 'bg-expense',
  exceeded: 'bg-expense',
};

export default function ProgressBar({ value = 0, level = 'ok', className = '', label = 'Progress' }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = LEVEL_COLORS[level] || 'bg-primary';
  return (
    <div className={`w-full bg-bg rounded-full h-2 overflow-hidden ${className}`} role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
