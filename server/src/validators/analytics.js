import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  range: z.enum(['week', 'month', '3months', 'year']).default('month'),
}).strict();
