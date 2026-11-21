import asyncHandler from '../utils/asyncHandler.js';
import { getDashboard } from '../services/dashboard.js';

export const dashboard = asyncHandler(async (req, res) => {
  const data = await getDashboard(req.user._id);
  res.json({ success: true, data });
});
