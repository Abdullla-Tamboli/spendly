import { z } from 'zod';

const monthRegex = /^\d{4}-\d{2}$/;

export const upsertBudgetSchema = z
  .object({
    overall: z.coerce.number().positive(),
    categories: z
      .array(
        z.object({
          category: z.string().trim().min(1).max(50),
          amount: z.coerce.number().positive(),
        }),
      )
      .optional()
      .default([]),
  })
  .strict();

export const monthParamSchema = z.object({
  month: z.string().regex(monthRegex, 'month must be in YYYY-MM format'),
});

export const monthQuerySchema = z.object({
  month: z.string().regex(monthRegex, 'month must be in YYYY-MM format').optional(),
});
