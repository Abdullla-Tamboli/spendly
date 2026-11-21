import { z } from 'zod';
import { month, positiveMoney } from './common.js';
export const upsertBudgetSchema = z.object({
  overall: positiveMoney,
  categories: z.array(z.object({ category: z.string().trim().min(1).max(30), amount: positiveMoney }).strict()).max(100).default([]),
}).strict().refine((v) => new Set(v.categories.map((c) => c.category.toLowerCase())).size === v.categories.length, 'Each category may only appear once');
export const monthParamSchema = z.object({ month }).strict();
export const monthQuerySchema = z.object({ month: month.optional() }).strict();
