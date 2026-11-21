import asyncHandler from '../utils/asyncHandler.js';
import { getAnalytics } from '../services/analytics.js';

export const analytics = asyncHandler(async (req, res) => {
  const data = await getAnalytics(req.user._id, req.query.range);
  res.json({ success: true, data });
});
