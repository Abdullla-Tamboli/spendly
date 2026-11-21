import mongoose from 'mongoose';
import RecurringRule from '../models/RecurringRule.js';
import AppError from '../utils/AppError.js';

export async function listRules(userId) {
  return RecurringRule.find({ user: userId }).sort({ nextDate: 1 }).lean();
}

export async function updateRule(userId, ruleId, data) {
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
