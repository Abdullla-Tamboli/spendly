import mongoose from 'mongoose';
import RecurringRule from '../models/RecurringRule.js';
import AppError from '../utils/AppError.js';
import Account from '../models/Account.js';
import { validateCategory } from './categories.js';

export async function listRules(userId) {
  return RecurringRule.find({ user: userId }).sort({ nextDate: 1 }).populate('account', '_id name type').lean();
}

export async function updateRule(userId, ruleId, data) {
  const existing = await RecurringRule.findOne({ _id: ruleId, user: userId });
  if (!existing) throw new AppError('Recurring rule not found', 404, 'NOT_FOUND');
  if (data.account && !await Account.exists({ _id: data.account, user: userId })) throw new AppError('Account not found', 404, 'NOT_FOUND');
  if (data.category) data.category = await validateCategory(userId, existing.type, data.category);
  const end = data.endDate === undefined ? existing.endDate : data.endDate;
  if ((data.active ?? existing.active) && end && end < (data.nextDate || existing.nextDate)) throw new AppError('End date must be on or after the next occurrence; choose a new next date to resume', 400, 'INVALID_DATE_RANGE');
  if (!mongoose.Types.ObjectId.isValid(ruleId)) {
    throw new AppError('Recurring rule not found', 404, 'NOT_FOUND');
  }
  const rule = await RecurringRule.findOneAndUpdate(
    { _id: ruleId, user: userId },
    { $set: data },
    { new: true, runValidators: true },
  );
  if (!rule) throw new AppError('Recurring rule not found', 404, 'NOT_FOUND');
  return rule;
}

export async function deleteRule(userId, ruleId) {
  if (!mongoose.Types.ObjectId.isValid(ruleId)) {
    throw new AppError('Recurring rule not found', 404, 'NOT_FOUND');
  }
  const result = await RecurringRule.findOneAndDelete({ _id: ruleId, user: userId });
  if (!result) throw new AppError('Recurring rule not found', 404, 'NOT_FOUND');
}
