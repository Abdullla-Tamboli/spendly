import mongoose from 'mongoose';
import Goal from '../models/Goal.js';
import AppError from '../utils/AppError.js';

function withProgress(goal) {
  const obj = goal.toObject ? goal.toObject() : { ...goal };
  obj.progress = goal.targetAmount > 0
    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
    : 0;
  return obj;
}

export async function listGoals(userId) {
  const goals = await Goal.find({ user: userId }).sort({ createdAt: -1 }).lean();
  return goals.map((g) => ({
    ...g,
    progress: g.targetAmount > 0
      ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
      : 0,
  }));
}

export async function createGoal(userId, data) {
  const goal = await Goal.create({ user: userId, ...data });
  return withProgress(goal);
}

export async function updateGoal(userId, goalId, data) {
  if (!mongoose.Types.ObjectId.isValid(goalId)) {
    throw new AppError('Goal not found', 404, 'NOT_FOUND');
  }
  const goal = await Goal.findOneAndUpdate(
    { _id: goalId, user: userId },
    { $set: data },
    { new: true, runValidators: true },
  );
  if (!goal) throw new AppError('Goal not found', 404, 'NOT_FOUND');
  return withProgress(goal);
}

export async function contributeToGoal(userId, goalId, amount) {
  if (!mongoose.Types.ObjectId.isValid(goalId)) {
    throw new AppError('Goal not found', 404, 'NOT_FOUND');
  }
  const goal = await Goal.findOneAndUpdate(
    { _id: goalId, user: userId },
    { $inc: { currentAmount: amount } },
    { new: true, runValidators: true },
  );
  if (!goal) throw new AppError('Goal not found', 404, 'NOT_FOUND');
  return withProgress(goal);
}

export async function deleteGoal(userId, goalId) {
  if (!mongoose.Types.ObjectId.isValid(goalId)) {
    throw new AppError('Goal not found', 404, 'NOT_FOUND');
  }
  const result = await Goal.findOneAndDelete({ _id: goalId, user: userId });
  if (!result) throw new AppError('Goal not found', 404, 'NOT_FOUND');
}
