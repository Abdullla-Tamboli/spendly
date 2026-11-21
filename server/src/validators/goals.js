import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createGoalSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
    targetAmount: z.coerce.number().positive(),
    currentAmount: z.coerce.number().min(0).optional().default(0),
    targetDate: z.coerce.date(),
  })
  .strict();

export const updateGoalSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    targetAmount: z.coerce.number().positive().optional(),
    currentAmount: z.coerce.number().min(0).optional(),
    targetDate: z.coerce.date().optional(),
  })
  .strict();

export const contributeSchema = z
  .object({
    amount: z.coerce.number().positive(),
  })
  .strict();

export const goalIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid goal ID'),
});

// re-export for recurring rules
export { objectIdRegex };
