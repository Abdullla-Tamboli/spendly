import { z } from 'zod';
export const money = z.coerce.number().min(0, 'Amount cannot be negative').max(1e9).refine((v) => Math.round(v * 100) / 100 === v, 'Use at most 2 decimal places');
export const positiveMoney = money.refine((v) => v > 0, 'Enter an amount greater than zero');
export const date = z.string().min(1, 'Choose a date');
export const accountTypes = [{ value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank account' }, { value: 'credit_card', label: 'Credit card' }, { value: 'wallet', label: 'Wallet' }, { value: 'savings', label: 'Savings' }];
export const frequencies = ['daily', 'weekly', 'monthly', 'yearly'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));
