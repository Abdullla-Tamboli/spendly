import asyncHandler from '../utils/asyncHandler.js';
import * as goalsService from '../services/goals.js';

export const list = asyncHandler(async (req, res) => {
  const data = await goalsService.listGoals(req.user._id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await goalsService.createGoal(req.user._id, req.body);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await goalsService.updateGoal(req.user._id, req.params.id, req.body);
  res.json({ success: true, data });
});

export const contribute = asyncHandler(async (req, res) => {
  const data = await goalsService.contributeToGoal(
    req.user._id,
    req.params.id,
    req.body.amount,
  );
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  await goalsService.deleteGoal(req.user._id, req.params.id);
  res.json({ success: true, data: { message: 'Goal deleted' } });
});
