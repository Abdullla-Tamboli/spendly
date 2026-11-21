import { z } from 'zod';
import { positiveMoney, objectId, isoDate, endDate } from './common.js';
export const patchRuleSchema = z.object({
  active: z.boolean().optional(),
  account: objectId.optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  amount: positiveMoney.optional(),
  category: z.string().trim().min(1).max(30).optional(),
  note: z.string().trim().max(200).optional(),
  nextDate: isoDate.optional(),
  endDate: endDate.nullable().optional(),
}).strict().refine((v) => Object.keys(v).length > 0, 'Choose at least one field to update');
export const ruleIdParamSchema = z.object({ id: objectId }).strict();
