import { addDays, addWeeks, addMonths, addYears, isAfter } from 'date-fns';
import mongoose from 'mongoose';
import RecurringRule from '../models/RecurringRule.js';
import Transaction from '../models/Transaction.js';

/**
 * Advance a date by one frequency step.
 */
function advanceDate(date, frequency) {
  switch (frequency) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      return addWeeks(date, 1);
    case 'monthly':
      return addMonths(date, 1);
    case 'yearly':
      return addYears(date, 1);
    default:
      return addMonths(date, 1);
  }
}

/**
 * Process all due recurring rules for a user.
 * Called on login and in auth middleware (throttled to once per hour).
 * Uses atomic findOneAndUpdate on nextDate to avoid duplicate creation.
 */
export async function processDueRecurring(userId) {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const now = new Date();

  // Find all active rules for this user that are due
  const dueRules = await RecurringRule.find({
    user: userObjId,
    active: true,
    nextDate: { $lte: now },
  }).lean();

  for (const rule of dueRules) {
    let iterations = 0;
    const maxIterations = 366;

    while (iterations < maxIterations) {
      // Check if nextDate is still <= now (rule may have been advanced by another process)
      if (isAfter(rule.nextDate, now)) break;
      if (rule.endDate && isAfter(rule.nextDate, rule.endDate)) {
        // Deactivate the rule
        await RecurringRule.findByIdAndUpdate(rule._id, { active: false });
        break;
      }

      const currentNextDate = new Date(rule.nextDate);
      const advancedDate = advanceDate(currentNextDate, rule.frequency);

      // Atomically claim this occurrence — only proceed if nextDate hasn't changed
      const claimed = await RecurringRule.findOneAndUpdate(
        {
          _id: rule._id,
          nextDate: currentNextDate, // optimistic lock
          active: true,
        },
        { $set: { nextDate: advancedDate } },
        { new: true },
      );

      if (!claimed) {
        // Another process already handled this occurrence
        break;
      }

      // Create the transaction (no recurringRule ref to avoid chaining)
      await Transaction.create({
        user: userObjId,
        account: rule.account,
        type: rule.type,
        amount: rule.amount,
        category: rule.category,
        note: rule.note || '',
        date: currentNextDate,
        // intentionally no `recurringRule` field — prevents recursive rule creation
      });

      // Update local cursor for next iteration
      rule.nextDate = advancedDate;
      iterations++;

      // Check if the new nextDate is past endDate
      if (rule.endDate && isAfter(advancedDate, rule.endDate)) {
        await RecurringRule.findByIdAndUpdate(rule._id, { active: false });
        break;
      }
    }
  }
}
