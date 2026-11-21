import { monthBounds } from '../utils/dates.js';
import { validateCategory } from './categories.js';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import AppError from '../utils/AppError.js';

/** Compute budget level and message from percentUsed */
export function computeBudgetLevel(spent, limit, monthLabel) {
  const ratio = limit > 0 ? (spent / limit) * 100 : 0;
  const percentUsed = Math.round(ratio * 100) / 100;
  const remaining = Math.round((limit - spent) * 100) / 100;
  let level, message;

  if (ratio >= 100) {
    level = 'exceeded';
    const over = Math.round((spent - limit) * 100) / 100;
    message = `Budget exceeded by $${over}.`;
  } else if (ratio >= 90) {
    level = 'danger';
    message = `You have used 90% of your ${monthLabel} budget.`;
  } else if (ratio >= 75) {
    level = 'warning';
    message = `You have used 75% of your ${monthLabel} budget.`;
  } else if (ratio >= 50) {
    level = 'info';
    message = `You have used 50% of your ${monthLabel} budget.`;
  } else {
    level = 'ok';
    message = `You are within your ${monthLabel} budget.`;
  }

  return { percentUsed, remaining, level, message };
}

async function getSpentForMonth(userId, month) {
  const { start, end } = monthBounds(month);

  const [result] = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', date: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return Math.round((result?.total ?? 0) * 100) / 100;
}

async function getCategorySpent(userId, month) {
  const { start, end } = monthBounds(month);

  const rows = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', spent: { $sum: '$amount' } } },
  ]);
  const map = {};
  for (const r of rows) map[r._id] = Math.round(r.spent * 100) / 100;
  return map;
}

export async function getBudget(userId, month) {
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(monthBounds(month).start);
  const budget = await Budget.findOne({ user: userId, month }).lean();
  const spent = await getSpentForMonth(userId, month);
  const catSpent = await getCategorySpent(userId, month);

  const overall = budget?.overall ?? 0;
  const overallStatus = computeBudgetLevel(spent, overall, monthLabel);

  const categories = (budget?.categories ?? []).map((c) => {
    const catSpentAmt = catSpent[c.category] ?? 0;
    return {
      category: c.category,
      amount: c.amount,
      spent: catSpentAmt,
      ...computeBudgetLevel(catSpentAmt, c.amount, monthLabel),
    };
  });

  return {
    month,
    overall,
    spent,
    ...overallStatus,
    categories,
    hasBudget: !!budget,
  };
}

export async function upsertBudget(userId, month, { overall, categories }) {
  categories = await Promise.all(categories.map(async (item) => ({ ...item, category: await validateCategory(userId, 'expense', item.category) })));
  await Budget.findOneAndUpdate(
    { user: userId, month },
    { $set: { overall, categories } },
    { upsert: true, new: true, runValidators: true },
  );
  return getBudget(userId, month);
}

export async function deleteBudget(userId, month) {
  const result = await Budget.findOneAndDelete({ user: userId, month });
  if (!result) throw new AppError('Budget not found', 404, 'NOT_FOUND');
}
