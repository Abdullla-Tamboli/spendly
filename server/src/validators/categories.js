import { z } from 'zod';
import { ALLOWED_ICONS } from '../utils/constants.js';

export const createCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(30),
    type: z.enum(['income', 'expense']),
    icon: z.enum(ALLOWED_ICONS).optional(),
  })
  .strict();

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(30).optional(),
    icon: z.enum(ALLOWED_ICONS).optional(),
  })
  .strict()
  .refine((d) => d.name !== undefined || d.icon !== undefined, {
    message: 'At least one of name or icon is required',
  });

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID'),
}).strict();
