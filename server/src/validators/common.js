import { z } from 'zod';

export const objectId = z.string().trim().regex(/^[a-f\d]{24}$/i, 'Invalid ID');
export const money = z.union([z.number(), z.string().trim().min(1)]).pipe(z.coerce.number().finite().min(0).max(1e9).refine((v) => Math.round(v * 100) / 100 === v, 'Use at most 2 decimal places'));
export const positiveMoney = money.refine((v) => v > 0, 'Amount must be greater than 0');
export const isoDate = z.string().trim().max(35).regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2}))?$/, 'Use an ISO date').refine((value) => {
  const day = value.slice(0, 10);
  const parsed = new Date(day);
  return !Number.isNaN(new Date(value).getTime()) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day;
}, 'Enter a valid calendar date').transform((v) => new Date(v));
export const endDate = isoDate.transform((date) => { date.setUTCHours(23, 59, 59, 999); return date; });
export const month = z.string().trim().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM with a valid month');
