import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const patchRuleSchema = z
  .object({
    active: z.boolean().optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
    amount: z.coerce.number().positive().optional(),
    category: z.string().trim().min(1).optional(),
    note: z.string().trim().max(200).optional(),
    endDate: z.coerce.date().optional().nullable(),
  })
  .strict();

export const ruleIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid rule ID'),
});
