import mongoose from 'mongoose';
import {
  subDays,
  subMonths,
  startOfDay,
  startOfWeek,
  startOfMonth,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from 'date-fns';
import Transaction from '../models/Transaction.js';

function getRangeDates(range) {
  const now = new Date();
  const to = now;
  let from;
  if (range === 'week') from = subDays(startOfDay(now), 6);
  else if (range === 'month') from = startOfMonth(now);
  else if (range === '3months') from = startOfMonth(subMonths(now, 2));
  else from = startOfMonth(subMonths(now, 11)); // year
  return { from, to };
}

function generateBuckets(from, to, range) {
  const keys = new Set();
  if (range === 'week' || range === 'month') {
    eachDayOfInterval({ start: from, end: to }).forEach((d) =>
      keys.add(format(d, 'yyyy-MM-dd')),
    );
  } else if (range === '3months') {
    eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 }).forEach((d) =>
      keys.add(format(d, 'yyyy-MM-dd')),
    );
  } else {
    eachMonthOfInterval({ start: from, end: to }).forEach((d) =>
      keys.add(format(d, 'yyyy-MM')),
    );
  }
  return [...keys].sort();
}

export async function getAnalytics(userId, range) {
  const { from, to } = getRangeDates(range);
  const userObjId = new mongoose.Types.ObjectId(userId);

  // --- Summary ---
  const summaryAgg = await Transaction.aggregate([
    { $match: { user: userObjId, date: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
      },
    },
  ]);
  const incomeTotal =
    Math.round((summaryAgg.find((r) => r._id === 'income')?.total ?? 0) * 100) / 100;
  const expenseTotal =
    Math.round((summaryAgg.find((r) => r._id === 'expense')?.total ?? 0) * 100) / 100;
  const summary = {
    income: incomeTotal,
    expenses: expenseTotal,
    netSavings: Math.round((incomeTotal - expenseTotal) * 100) / 100,
  };

  // --- Category breakdown (expenses only) ---
  const catAgg = await Transaction.aggregate([
    { $match: { user: userObjId, type: 'expense', date: { $gte: from, $lte: to } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);
  const categoryBreakdown = catAgg.map((r) => ({
    category: r._id,
    amount: Math.round(r.total * 100) / 100,
    percentage:
      expenseTotal > 0 ? Math.round((r.total / expenseTotal) * 10000) / 100 : 0,
  }));

  // --- Trend buckets ---
  const trendAgg = await Transaction.aggregate([
    { $match: { user: userObjId, date: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: {
          type: '$type',
          bucket: {
            $dateToString: {
              format:
                range === 'year'
                  ? '%Y-%m'
                  : range === '3months'
                  ? '%Y-%m-%d'
                  : '%Y-%m-%d',
              date: '$date',
            },
          },
        },
        total: { $sum: '$amount' },
      },
    },
  ]);

  // For 3months, snap raw daily keys to Monday-of-week
  const snapKey = (rawKey) => {
    if (range === '3months') {
      return format(startOfWeek(new Date(rawKey), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    }
    return rawKey;
  };

  // Merge aggregation results into bucket map
  const incomeMap = {};
  const expenseMap = {};
  for (const r of trendAgg) {
    const k = snapKey(r._id.bucket);
    if (r._id.type === 'income') incomeMap[k] = (incomeMap[k] ?? 0) + r.total;
    else expenseMap[k] = (expenseMap[k] ?? 0) + r.total;
  }

  const buckets = generateBuckets(from, to, range);
  const trend = buckets.map((key) => ({
    period: key,
    income: Math.round((incomeMap[key] ?? 0) * 100) / 100,
    expenses: Math.round((expenseMap[key] ?? 0) * 100) / 100,
  }));

  return { summary, categoryBreakdown, trend };
}
