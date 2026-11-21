import asyncHandler from '../utils/asyncHandler.js';
import * as budgetService from '../services/budgets.js';

export const get = asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const data = await budgetService.getBudget(req.user._id, month);
  res.json({ success: true, data });
});

export const upsert = asyncHandler(async (req, res) => {
  const data = await budgetService.upsertBudget(req.user._id, req.params.month, req.body);
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  await budgetService.deleteBudget(req.user._id, req.params.month);
  res.json({ success: true, data: { message: 'Budget deleted' } });
});
