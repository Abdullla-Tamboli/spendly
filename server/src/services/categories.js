import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import AppError from '../utils/AppError.js';
import { DEFAULT_CATEGORIES } from '../utils/constants.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import RecurringRule from '../models/RecurringRule.js';
import Budget from '../models/Budget.js';

export async function listCategories(userId) {
  const custom = await Category.find({ user: userId }).sort({ type: 1, name: 1 }).lean();

  // Merge defaults with custom; mark source for client convenience
  const defaults = [
    ...DEFAULT_CATEGORIES.expense.map((name) => ({ name, type: 'expense', isDefault: true })),
    ...DEFAULT_CATEGORIES.income.map((name) => ({ name, type: 'income', isDefault: true })),
  ];

  const customMapped = custom.map((c) => ({ ...c, isDefault: false }));
  return [...defaults, ...customMapped];
}

export async function createCategory(userId, { name, type, icon }) {
  // Reject if name collides with a default category for that type
  const defaults = DEFAULT_CATEGORIES[type] || [];
  if (defaults.map((d) => d.toLowerCase()).includes(name.toLowerCase())) {
    throw new AppError(
      `"${name}" is already a default ${type} category`,
      409,
      'DUPLICATE_DEFAULT_CATEGORY',
    );
  }

  const category = await Category.create({ user: userId, name, type, icon });
  return { ...category.toObject(), isDefault: false };
}

export async function updateCategory(userId, categoryId, updates) {
  const category = await Category.findOne({ _id: categoryId, user: userId });
  if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND');
  const previous = category.name;
  if (updates.name && updates.name !== previous) {
    if (DEFAULT_CATEGORIES[category.type].some((name) => name.toLowerCase() === updates.name.toLowerCase())) {
      throw new AppError('That default category already exists', 409, 'DUPLICATE_DEFAULT_CATEGORY');
    }
    const duplicate = await Category.exists({ user: userId, type: category.type, _id: { $ne: category._id }, name: { $regex: `^${escapeRegex(updates.name)}$`, $options: 'i' } });
    if (duplicate) throw new AppError('That category already exists', 409, 'DUPLICATE_KEY');
  }
  Object.assign(category, updates);
  await category.save();
  if (category.name !== previous) {
    const filter = { user: userId, type: category.type, category: previous };
    await Transaction.updateMany(filter, { $set: { category: category.name } });
    await RecurringRule.updateMany(filter, { $set: { category: category.name } });
    if (category.type === 'expense') await Budget.updateMany({ user: userId, 'categories.category': previous }, { $set: { 'categories.$[item].category': category.name } }, { arrayFilters: [{ 'item.category': previous }] });
  }
  return category;
}

export async function deleteCategory(userId, categoryId) {
  const category = await Category.findOne({ _id: categoryId, user: userId });
  if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND');

  const inUse = await Transaction.countDocuments({
    user: userId,
    category: category.name,
    type: category.type,
  });
  const ruleInUse = await RecurringRule.exists({ user: userId, category: category.name, type: category.type });
  const budgetInUse = category.type === 'expense' && await Budget.exists({ user: userId, 'categories.category': category.name });
  if (inUse > 0 || ruleInUse || budgetInUse) {
    throw new AppError(
      'Cannot delete a category used by transactions, recurring rules, or budgets',
      409,
      'CATEGORY_IN_USE',
    );
  }

  await category.deleteOne();
}

/**
 * Validate that `name` is a valid category for `type` for this user.
 * Used by the transaction service.
 */
export async function validateCategory(userId, type, name) {
  const defaults = DEFAULT_CATEGORIES[type] || [];
  const defaultName = defaults.find((d) => d.toLowerCase() === name.toLowerCase());
  if (defaultName) return defaultName;

  const custom = await Category.findOne({
    user: userId,
    type,
    name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
  });
  if (!custom) {
    throw new AppError(
      `"${name}" is not a valid ${type} category`,
      400,
      'INVALID_CATEGORY',
    );
  }
  return custom.name;
}
