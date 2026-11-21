import Transaction from '../models/Transaction.js';
import { buildFilter, SORT_MAP } from './transactions.js';

export function csvField(value) {
  const text = String(value ?? '');
  const safe = /^[\s]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export async function exportTransactions(userId, query) {
  const transactions = await Transaction.find(buildFilter(userId, query)).sort(SORT_MAP[query.sort] || SORT_MAP.date_desc).populate('account', 'name').lean();
  const rows = transactions.map((tx) => [
    tx.date.toISOString().slice(0, 10),
    tx.type === 'income' ? 'Income' : 'Expense',
    csvField(tx.category), csvField(tx.account?.name), tx.amount, csvField(tx.note),
  ].join(','));
  return ['Date,Type,Category,Account,Amount,Note', ...rows].join('\n') + '\n';
}
