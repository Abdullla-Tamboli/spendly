import mongoose from 'mongoose';
import { monthStart, monthKey } from '../utils/dates.js';
import Transaction from '../models/Transaction.js';
import { getBudget } from './budgets.js';

export async function getDashboard(userId) {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const currentMonth = monthKey(now);

  // --- All-time totals ---
  const totalsAgg = await Transaction.aggregate([
    { $match: { user: userObjId } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);
  const totalIncome =
    Math.round((totalsAgg.find((r) => r._id === 'income')?.total ?? 0) * 100) / 100;
  const totalExpenses =
    Math.round((totalsAgg.find((r) => r._id === 'expense')?.total ?? 0) * 100) / 100;
  const balance = Math.round((totalIncome - totalExpenses) * 100) / 100;

  // --- Current month budget summary ---
  const budget = await getBudget(userId, currentMonth);

  // --- Recent transactions (latest 8) ---
  const recentTransactions = await Transaction.aggregate([
    { $match: { user: userObjId } }, { $sort: { date: -1, _id: -1 } }, { $limit: 8 },
    { $lookup: { from: 'accounts', localField: 'account', foreignField: '_id', pipeline: [{ $match: { user: userObjId } }, { $project: { name: 1, type: 1 } }], as: 'account' } },
    { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
  ]);

  // --- Overview chart: income vs expense for last 6 months ---
  const sixMonthsAgo = monthStart(now, -5);
  const overviewAgg = await Transaction.aggregate([
    { $match: { user: userObjId, date: { $gte: sixMonthsAgo, $lt: monthStart(now, 1) } } },
    {
      $group: {
        _id: {
          type: '$type',
          month: { $dateToString: { format: '%Y-%m', date: '$date' } },
        },
        total: { $sum: '$amount' },
      },
    },
  ]);

  // Build 6-month bucket array
  const months = Array.from({ length: 6 }, (_, i) =>
    monthKey(monthStart(now, i - 5)),
  );
  const incomeMap = {};
  const expenseMap = {};
  for (const r of overviewAgg) {
    if (r._id.type === 'income') incomeMap[r._id.month] = r.total;
    else expenseMap[r._id.month] = r.total;
  }
  const overview = months.map((m) => ({
    month: m,
    income: Math.round((incomeMap[m] ?? 0) * 100) / 100,
    expenses: Math.round((expenseMap[m] ?? 0) * 100) / 100,
  }));

  return { totalIncome, totalExpenses, balance, budget, recentTransactions, overview };
}
