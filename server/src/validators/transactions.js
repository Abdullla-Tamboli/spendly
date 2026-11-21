import { z } from 'zod';
import { objectId, positiveMoney, money, isoDate, endDate } from './common.js';

const fields = {
  account: objectId,
  type: z.enum(['income', 'expense']),
  amount: positiveMoney,
  category: z.string().trim().min(1).max(30),
  note: z.string().trim().max(200),
  date: isoDate,
};
export const createTransactionSchema = z.object({
  ...fields,
  note: fields.note.optional().default(''),
  date: isoDate.optional(),
  recurring: z.object({ enabled: z.boolean(), frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(), endDate: endDate.optional() }).strict().refine((v) => !v.enabled || !!v.frequency, 'Choose a recurring frequency').optional(),
}).strict().refine((v) => !v.recurring?.endDate || v.recurring.endDate >= (v.date || new Date()), 'Recurring end date must be on or after the transaction date');
export const updateTransactionSchema = z.object(fields).partial().strict().refine((v) => Object.keys(v).length > 0, 'At least one field is required');
const query = z.object({
  page: z.coerce.number().int().positive().max(1e7).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: fields.type.optional(),
  category: z.string().trim().max(1000).optional(),
  account: objectId.optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  minAmount: money.optional(),
  maxAmount: money.optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['date_desc', 'date_asc', 'amount_desc', 'amount_asc']).default('date_desc'),
}).strict();
const ordered = (schema) => schema.refine((v) => !v.from || !v.to || v.from <= v.to, 'Start date must not be after end date').refine((v) => v.minAmount === undefined || v.maxAmount === undefined || v.minAmount <= v.maxAmount, 'Minimum amount must not exceed maximum');
export const listTransactionsQuerySchema = ordered(query);
export const exportQuerySchema = ordered(query.omit({ page: true, limit: true }));
export const idParamSchema = z.object({ id: objectId }).strict();
