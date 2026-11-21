import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import AppError from '../utils/AppError.js';

/** Compute balance for every account owned by userId via aggregation */
async function computeBalances(userId) {
  const pipeline = [
    { $match: { user: userId } },
    {
      $group: {
        _id: '$account',
        income: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
        },
        expense: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
        },
      },
    },
  ];
  const rows = await Transaction.aggregate(pipeline);
  const map = {};
  for (const r of rows) {
    map[r._id.toString()] = Math.round((r.income - r.expense) * 100) / 100;
  }
  return map;
}

export async function listAccounts(userId) {
  const accounts = await Account.find({ user: userId }).sort({ createdAt: 1 }).lean();
  const balanceMap = await computeBalances(userId);

  let combinedTotal = 0;
  const data = accounts.map((acc) => {
    const balance = balanceMap[acc._id.toString()] ?? 0;
    combinedTotal += balance;
    return { ...acc, balance };
  });

  return {
    accounts: data,
    combinedTotal: Math.round(combinedTotal * 100) / 100,
  };
}

export async function createAccount(userId, { name, type }) {
  const account = await Account.create({ user: userId, name, type });
  return { ...account.toObject(), balance: 0 };
}

export async function updateAccount(userId, accountId, updates) {
  const account = await Account.findOneAndUpdate(
    { _id: accountId, user: userId },
    updates,
    { new: true, runValidators: true },
  );
  if (!account) throw new AppError('Account not found', 404, 'NOT_FOUND');
  return account;
}

export async function deleteAccount(userId, accountId) {
  const account = await Account.findOne({ _id: accountId, user: userId });
  if (!account) throw new AppError('Account not found', 404, 'NOT_FOUND');

  const txCount = await Transaction.countDocuments({ user: userId, account: accountId });
  if (txCount > 0) {
    throw new AppError(
      'Cannot delete account with existing transactions',
      409,
      'ACCOUNT_HAS_TRANSACTIONS',
    );
  }

  await account.deleteOne();
}
