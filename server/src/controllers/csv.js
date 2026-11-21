import asyncHandler from '../utils/asyncHandler.js';
import { exportTransactions } from '../services/csv.js';

export const exportCsv = asyncHandler(async (req, res) => {
  const csv = await exportTransactions(req.user._id, req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="spendly-transactions.csv"');
  res.send(csv);
});