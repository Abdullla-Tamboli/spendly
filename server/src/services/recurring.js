import { addDays, addWeeks, addMonths, addYears } from 'date-fns';
import mongoose from 'mongoose';
import RecurringRule from '../models/RecurringRule.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

export function advanceDate(date, frequency) {
  return { daily: addDays, weekly: addWeeks, monthly: addMonths, yearly: addYears }[frequency](date, 1);
}

export async function processDueRecurring(userId) {
  const user = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const rules = await RecurringRule.find({ user, active: true, nextDate: { $lte: now } }).lean();
  for (const rule of rules) {
    for (let i = 0; i < 366 && rule.nextDate <= now; i++) {
      if (rule.endDate && rule.nextDate > rule.endDate) {
        await RecurringRule.updateOne({ _id: rule._id, user, nextDate: rule.nextDate }, { $set: { active: false } });
        break;
      }
      const processingAt = new Date();
      const claimed = await RecurringRule.findOneAndUpdate({
        _id: rule._id, user, active: true, nextDate: rule.nextDate,
        $or: [{ processingAt: null }, { processingAt: { $lt: new Date(Date.now() - 300000) } }],
      }, { $set: { processingAt } }, { new: true });
      if (!claimed) break;
      const nextDate = advanceDate(claimed.nextDate, claimed.frequency);
      try {
        // Persist idempotently before advancing. A crash is safe to retry, and the
        // unique occurrence index protects overlapping requests and stale locks.
        await Transaction.updateOne({ user, recurringRule: claimed._id, date: claimed.nextDate }, { $setOnInsert: {
          user, recurringRule: claimed._id, date: claimed.nextDate, account: claimed.account,
          type: claimed.type, amount: claimed.amount, category: claimed.category, note: claimed.note || '',
        } }, { upsert: true, runValidators: true });
        await RecurringRule.updateOne({ _id: claimed._id, user, nextDate: claimed.nextDate, processingAt }, {
          $set: { nextDate, ...(claimed.endDate && nextDate > claimed.endDate ? { active: false } : {}) },
          $unset: { processingAt: 1 },
        });
      } catch (err) {
        await RecurringRule.updateOne({ _id: claimed._id, user, processingAt }, { $unset: { processingAt: 1 } });
        throw err;
      }
      rule.nextDate = nextDate;
      if (claimed.endDate && nextDate > claimed.endDate) break;
    }
  }
}

export async function checkRecurring(userId) {
  const checkedAt = new Date();
  const user = await User.findOneAndUpdate({
    _id: userId,
    $or: [{ lastRecurringCheck: null }, { lastRecurringCheck: { $lte: new Date(Date.now() - 3600000) } }],
  }, { $set: { lastRecurringCheck: checkedAt } });
  if (!user) return;
  try {
    await processDueRecurring(userId);
  } catch (err) {
    await User.updateOne({ _id: userId, lastRecurringCheck: checkedAt }, { $unset: { lastRecurringCheck: 1 } });
    throw err;
  }
}
