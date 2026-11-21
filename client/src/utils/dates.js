import { format, parseISO } from 'date-fns';

export function formatDate(date, fmt = 'MMM d, yyyy') {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date.slice(0, 10)) : date;
  return format(d, fmt);
}

export function toInputDate(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date.slice(0, 10)) : date;
  return format(d, 'yyyy-MM-dd');
}

export function currentMonth() {
  return format(new Date(), 'yyyy-MM');
}
