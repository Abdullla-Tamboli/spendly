import asyncHandler from '../utils/asyncHandler.js';
import * as authService from '../services/auth.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json({ success: true, data: result });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  res.json({ success: true, data: result });
});

export const sendOtp = asyncHandler(async (req, res) => {
  const result = await authService.sendLoginOtp(req.body.email);
  res.json({ success: true, data: result });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyLoginOtp(req.body);
  res.json({ success: true, data: result });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  res.json({ success: true, data: { user } });
});

export const logout = asyncHandler(async (_req, res) => {
  // JWT is stateless; client discards the token.
  res.json({ success: true, data: { message: 'Logged out successfully' } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);
  res.json({ success: true, data: { user } });
});
