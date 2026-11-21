// Currency formatter
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format for display with sign (+/-)
export function formatAmount(amount, type, currency = 'USD') {
  const formatted = formatCurrency(Math.abs(amount), currency);
  return type === 'income' ? `+${formatted}` : `-${formatted}`;
}
