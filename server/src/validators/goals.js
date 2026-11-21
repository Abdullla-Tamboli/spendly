import { z } from 'zod';
import { positiveMoney, money, objectId, isoDate } from './common.js';
const fields = { name: z.string().trim().min(1).max(60), targetAmount: positiveMoney, currentAmount: money, targetDate: isoDate };
export const createGoalSchema = z.object({ ...fields, currentAmount: money.default(0) }).strict();
export const updateGoalSchema = z.object(fields).partial().strict().refine((v) => Object.keys(v).length > 0, 'Choose at least one field to update');
export const contributeSchema = z.object({ amount: positiveMoney }).strict();
export const goalIdParamSchema = z.object({ id: objectId }).strict();
