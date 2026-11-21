import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { addMonths } from 'date-fns';
import { connectDB } from '../src/config/db.js';
import { registerUser } from '../src/services/auth.js';
import User from '../src/models/User.js';
import Account from '../src/models/Account.js';
import Transaction from '../src/models/Transaction.js';
import Budget from '../src/models/Budget.js';
import Goal from '../src/models/Goal.js';
import RecurringRule from '../src/models/RecurringRule.js';

if (process.env.NODE_ENV === 'production') throw new Error('The demo seed is for development only.');
await connectDB();
try {
  if (await User.exists({ email: 'demo@spendly.dev' })) {
    process.stdout.write('Demo user already exists. No records changed.\n');
  } else {
    const password = process.env.SEED_PASSWORD || 'Spendly' + randomBytes(12).toString('hex') + '1';
    const { user } = await registerUser({ name: 'Alex Morgan', email: 'demo@spendly.dev', password });
    const accounts = await Account.find({ user: user._id });
    const bank = accounts.find((a) => a.type === 'bank');
    const cash = accounts.find((a) => a.type === 'cash');
    const savings = await Account.create({ user: user._id, name: 'Future fund', type: 'savings' });
    const card = await Account.create({ user: user._id, name: 'Everyday card', type: 'credit_card' });
    const now = new Date();
    const entries = [];
    const monthDate = (offset, day) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, day, 9));
    for (let offset = -5; offset <= 0; offset++) {
      const rows = [
        [1, 'income', 4200, 'Salary', 'Monthly salary', bank],
        [3, 'income', 650 + (offset + 5) * 25, 'Freelance', 'Design project', bank],
        [4, 'income', 200, 'Gift', 'Family savings contribution', savings],
        [5, 'expense', 1450, 'Rent', 'Home, sweet home', bank],
        [7, 'expense', 92.5 + offset * 2, 'Food', 'Weekly groceries', card],
        [9, 'expense', 48, 'Travel', 'Monthly transit pass', cash],
        [11, 'expense', 149.99, 'Shopping', 'A few everyday essentials', card],
        [13, 'expense', 85, 'Bills', 'Internet and utilities', bank],
        [15, 'expense', 15.99, 'Subscription', 'Music subscription', card],
        [17, 'expense', 62, 'Health', 'Gym membership', bank],
        [19, 'expense', 38.5, 'Food', 'Dinner with friends', card],
        [21, 'expense', 24, 'Entertainment', 'Movie night', cash],
        [23, 'expense', 45, 'Education', 'A new book and course', card],
        [26, 'expense', 75.25, 'Food', 'Fresh groceries', card],
      ];
      for (const [day, type, amount, category, note, account] of rows) {
        const date = monthDate(offset, day);
        if (date <= now) entries.push({ user: user._id, account: account._id, type, amount, category, note, date });
      }
    }
    await Transaction.insertMany(entries);
    await Budget.create({ user: user._id, month: now.toISOString().slice(0, 7), overall: 3000, categories: [{ category: 'Food', amount: 400 }, { category: 'Shopping', amount: 250 }, { category: 'Travel', amount: 150 }] });
    await Goal.insertMany([
      { user: user._id, name: 'A summer in the mountains', targetAmount: 2400, currentAmount: 1350, targetDate: addMonths(now, 7) },
      { user: user._id, name: 'A little peace of mind', targetAmount: 10000, currentAmount: 4200, targetDate: addMonths(now, 12) },
    ]);
    await RecurringRule.insertMany([
      { user: user._id, account: bank._id, type: 'expense', amount: 1450, category: 'Rent', note: 'Monthly rent', frequency: 'monthly', nextDate: monthDate(1, 5) },
      { user: user._id, account: bank._id, type: 'income', amount: 4200, category: 'Salary', note: 'Monthly salary', frequency: 'monthly', nextDate: monthDate(1, 1) },
      { user: user._id, account: card._id, type: 'expense', amount: 15.99, category: 'Subscription', note: 'Music subscription', frequency: 'monthly', nextDate: monthDate(1, 15) },
    ]);
    process.stdout.write('Demo data saved to MongoDB for demo@spendly.dev.\n');
    if (!process.env.SEED_PASSWORD) process.stdout.write('One-time demo password: ' + password + '\n');
  }
} finally {
  await mongoose.disconnect();
}
