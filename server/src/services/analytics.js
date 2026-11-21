import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import { monthStart, monday, roundMoney } from '../utils/dates.js';

export async function getAnalytics(userId, range) {
  const to = new Date();
  const today = new Date(to);
  today.setUTCHours(0, 0, 0, 0);
  const from = range === 'week' ? new Date(today.getTime() - 6 * 86400000) : monthStart(to, range === '3months' ? -2 : range === 'year' ? -11 : 0);
  const match = { user: new mongoose.Types.ObjectId(userId), date: { $gte: from, $lte: to } };
  const bucket = range === '3months'
    ? { $dateToString: { format: '%Y-%m-%d', date: { $dateTrunc: { date: '$date', unit: 'week', startOfWeek: 'monday', timezone: 'UTC' } }, timezone: 'UTC' } }
    : { $dateToString: { format: range === 'year' ? '%Y-%m' : '%Y-%m-%d', date: '$date', timezone: 'UTC' } };
  const [totals, categories, grouped] = await Promise.all([
    Transaction.aggregate([{ $match: match }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]),
    Transaction.aggregate([{ $match: { ...match, type: 'expense' } }, { $group: { _id: '$category', total: { $sum: '$amount' } } }, { $sort: { total: -1, _id: 1 } }]),
    Transaction.aggregate([{ $match: match }, { $group: { _id: { type: '$type', bucket }, total: { $sum: '$amount' } } }]),
  ]);
  const income = roundMoney(totals.find((r) => r._id === 'income')?.total || 0);
  const expenses = roundMoney(totals.find((r) => r._id === 'expense')?.total || 0);
  const values = new Map(grouped.map((r) => [r._id.bucket + ':' + r._id.type, r.total]));
  const trend = [];
  let cursor = range === '3months' ? monday(from) : new Date(from);
  while (cursor <= to) {
    const period = cursor.toISOString().slice(0, range === 'year' ? 7 : 10);
    trend.push({ period, income: roundMoney(values.get(period + ':income') || 0), expenses: roundMoney(values.get(period + ':expense') || 0) });
    if (range === 'year') cursor = monthStart(cursor, 1);
    else cursor.setUTCDate(cursor.getUTCDate() + (range === '3months' ? 7 : 1));
  }
  return {
    summary: { income, expenses, netSavings: roundMoney(income - expenses) },
    categoryBreakdown: categories.map((r) => ({ category: r._id, amount: roundMoney(r.total), percentage: expenses ? roundMoney(r.total / expenses * 100) : 0 })),
    trend,
  };
}
