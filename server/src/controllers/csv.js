import asyncHandler from '../utils/asyncHandler.js';
import { buildFilter } from '../services/transactions.js';
import Transaction from '../models/Transaction.js';
import { format } from 'date-fns';

/** Sanitise a CSV field: quote if needed, prevent formula injection */
function csvField(value) {
  const str = value === null || value === undefined ? '' : String(value);
  // Prevent CSV injection
  const sanitised = /^[=+\-@]/.test(str) ? `'${str}` : str;
  // Quote if the field contains comma, quote, or newline
  if (/[",\n\r]/.test(sanitised)) {
    return `"${sanitised.replace(/"/g, '""')}"`;
  }
  return sanitised;
}

export const exportCsv = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.user._id, req.query);

  const transactions = await Transaction.find(filter)
    .sort({ date: -1 })
    .populate('account', 'name')
    .lean();

  const header = 'Date,Type,Category,Account,Amount,Note\n';
  const rows = transactions
    .map((tx) => {
      const date = format(new Date(tx.date), 'yyyy-MM-dd');
      const type = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
      const category = csvField(tx.category);
      const account = csvField(tx.account?.name ?? '');
      const amount = tx.amount;
      const note = csvField(tx.note ?? '');
      return `${date},${type},${category},${account},${amount},${note}`;
    })
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="spendly-transactions.csv"');
  res.send(header + rows);
});
