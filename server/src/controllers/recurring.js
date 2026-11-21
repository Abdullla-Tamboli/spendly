import asyncHandler from '../utils/asyncHandler.js';
import * as rulesService from '../services/recurringRules.js';

export const list = asyncHandler(async (req, res) => {
  const data = await rulesService.listRules(req.user._id);
  res.json({ success: true, data });
});

export const patch = asyncHandler(async (req, res) => {
  const data = await rulesService.updateRule(req.user._id, req.params.id, req.body);
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  await rulesService.deleteRule(req.user._id, req.params.id);
  res.json({ success: true, data: { message: 'Recurring rule deleted' } });
});
