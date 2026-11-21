import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createTransactionSchema = z
  .object({
    account: z.string().regex(objectIdRegex, 'Invalid account ID'),
    type: z.enum(['income', 'expense']),
    amount: z.coerce
      .number()
      .positive('Amount must be greater than 0')
      .max(1e9)
      .refine((v) => Math.round(v * 100) / 100 === v, 'Amount may have at most 2 decimal places'),
    category: z.string().trim().min(1).max(50),
    note: z.string().trim().max(200).optional().default(''),
    date: z.coerce.date().optional(),
    // Recurring — full logic in Milestone 7; accepted here and passed through
    recurring: z
      .object({
        enabled: z.boolean(),
        frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
        endDate: z.coerce.date().optional(),
      })
      .optional(),
  })
  .strict();

export const updateTransactionSchema = z
  .object({
    account: z.string().regex(objectIdRegex, 'Invalid account ID').optional(),
    type: z.enum(['income', 'expense']).optional(),
    amount: z.coerce
      .number()
      .positive()
      .max(1e9)
      .refine((v) => Math.round(v * 100) / 100 === v, 'Amount may have at most 2 decimal places')
      .optional(),
    category: z.string().trim().min(1).max(50).optional(),
    note: z.string().trim().max(200).optional(),
    date: z.coerce.date().optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' });

export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100, 'limit must be <= 100')
    .default(20),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().trim().optional(),
  account: z.string().regex(objectIdRegex).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['date_desc', 'date_asc', 'amount_desc', 'amount_asc']).default('date_desc'),
});

export const exportQuerySchema = listTransactionsQuerySchema.omit({ page: true, limit: true });

export const idParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid ID'),
});
