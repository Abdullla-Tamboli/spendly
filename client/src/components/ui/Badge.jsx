const VARIANTS = {
  income: 'bg-income-tint text-income',
  expense: 'bg-expense-tint text-expense',
  warning: 'bg-warning-tint text-warning',
  default: 'bg-bg text-text-secondary',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant] || VARIANTS.default} ${className}`}
    >
      {children}
    </span>
  );
}
