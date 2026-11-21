import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import AppError from '../utils/AppError.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { validateCategory } from './categories.js';

const SORT_MAP = {
  date_desc: { date: -1 },
  date_asc: { date: 1 },
  amount_desc: { amount: -1 },
  amount_asc: { amount: 1 },
};

/**
 * Build a Mongo filter from fully-validated query params.
 * Never spreads raw user input — only uses parsed primitives.
 */
export function buildFilter(userId, params) {
  const filter = { user: userId };

  if (params.type) filter.type = params.type;

  if (params.category) {
    const cats = params.category
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    if (cats.length === 1) {
      filter.category = { $regex: escapeRegex(cats[0]), $options: 'i' };
    } else if (cats.length > 1) {
      filter.category = { $in: cats.map((c) => new RegExp(escapeRegex(c), 'i')) };
    }
  }

  if (params.account) {
    filter.account = new mongoose.Types.ObjectId(params.account);
  }

  if (params.from || params.to) {
    filter.date = {};
    if (params.from) {
      const start = new Date(params.from);
      start.setUTCHours(0, 0, 0, 0);
      filter.date.$gte = start;
    }
    if (params.to) {
      const end = new Date(params.to);
      end.setUTCHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  if (params.minAmount !== undefined || params.maxAmount !== undefined) {
    filter.amount = {};
    if (params.minAmount !== undefined) filter.amount.$gte = params.minAmount;
    if (params.maxAmount !== undefined) filter.amount.$lte = params.maxAmount;
  }

  if (params.search) {
    const escaped = escapeRegex(params.search);
    const orClauses = [
      { note: { $regex: escaped, $options: 'i' } },
      { category: { $regex: escaped, $options: 'i' } },
    ];
    // If the search term is numeric, also match exact amount
    const numeric = Number(params.search);
    if (!isNaN(numeric) && numeric > 0) {
      orClauses.push({ amount: numeric });
    }
    filter.$or = orClauses;
  }

  return filter;
}

export async function listTransactions(userId, params) {
  const filter = buildFilter(userId, params);
  const sort = SORT_MAP[params.sort] || SORT_MAP.date_desc;
  const page = params.page;
  const limit = params.limit;
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('account', '_id name type')
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTransaction(userId, transactionId) {
  const tx = await Transaction.findOne({ _id: transactionId, user: userId })
    .populate('account', '_id name type')
    .lean();
  if (!tx) throw new AppError('Transaction not found', 404, 'NOT_FOUND');
  return tx;
}

export async function createTransaction(userId, body) {
  const { account, type, amount, category, note, date, recurring } = body;

  // Verify account belongs to user
  const acc = await Account.findOne({ _id: account, user: userId });
  if (!acc) throw new AppError('Account not found', 404, 'NOT_FOUND');

  // Validate category
  await validateCategory(userId, type, category);

  const tx = await Transaction.create({
    user: userId,
    account,
    type,
    amount,
    category,
    note: note ?? '',
    date: date ?? new Date(),
  });

  // Recurring rule creation delegated to Milestone 7
  // If recurring.enabled, the recurringService will handle it after M7 wiring
  if (recurring?.enabled) {
    // Will be called from the route after M7; no-op for now
  }

  return Transaction.findById(tx._id).populate('account', '_id name type').lean();
}

export async function updateTransaction(userId, transactionId, updates) {
  // If type or category is being updated, validate the new combo
  const existing = await Transaction.findOne({ _id: transactionId, user: userId });
  if (!existing) throw new AppError('Transaction not found', 404, 'NOT_FOUND');

  if (updates.account) {
    const acc = await Account.findOne({ _id: updates.account, user: userId });
    if (!acc) throw new AppError('Account not found', 404, 'NOT_FOUND');
  }

  const newType = updates.type ?? existing.type;
  const newCategory = updates.category ?? existing.category;
  await validateCategory(userId, newType, newCategory);

  const tx = await Transaction.findOneAndUpdate(
    { _id: transactionId, user: userId },
    updates,
    { new: true, runValidators: true },
  ).populate('account', '_id name type');

  return tx;
}

export async function deleteTransaction(userId, transactionId) {
  const tx = await Transaction.findOneAndDelete({ _id: transactionId, user: userId });
  if (!tx) throw new AppError('Transaction not found', 404, 'NOT_FOUND');
}
