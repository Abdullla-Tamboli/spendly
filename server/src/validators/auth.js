import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().trim().toLowerCase().email('Invalid email address').max(254),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address').max(254),
  password: z.string().min(1, 'Password is required').max(72),
}).strict();

export const sendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address').max(254),
}).strict();

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address').max(254),
  otp: z.string().trim().length(6, 'Verification code must be 6 digits').regex(/^\d{6}$/, 'Verification code must contain digits only'),
}).strict();

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(60),
  currency: z.enum(['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'AED']),
}).strict();
