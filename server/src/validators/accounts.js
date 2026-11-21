import { z } from 'zod';

export const createAccountSchema = z
  .object({
    name: z.string().trim().min(1).max(40),
    type: z.enum(['cash', 'bank', 'credit_card', 'wallet', 'savings']),
  })
  .strict();

export const updateAccountSchema = z
  .object({
    name: z.string().trim().min(1).max(40).optional(),
    type: z.enum(['cash', 'bank', 'credit_card', 'wallet', 'savings']).optional(),
  })
  .strict()
  .refine((d) => d.name !== undefined || d.type !== undefined, {
    message: 'At least one of name or type is required',
  });

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID'),
}).strict();
