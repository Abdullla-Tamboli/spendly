import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import AppError from '../utils/AppError.js';
import { DEFAULT_CATEGORIES } from '../utils/constants.js';

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
  const category = await Category.findOneAndUpdate(
    { _id: categoryId, user: userId },
    updates,
    { new: true, runValidators: true },
  );
  if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND');
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
  if (inUse > 0) {
    throw new AppError(
      `Cannot delete category in use by ${inUse} transaction(s)`,
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
  if (defaults.map((d) => d.toLowerCase()).includes(name.toLowerCase())) return true;

  const custom = await Category.findOne({
    user: userId,
    type,
    name: { $regex: `^${name}$`, $options: 'i' },
  });
  if (!custom) {
    throw new AppError(
      `"${name}" is not a valid ${type} category`,
      400,
      'INVALID_CATEGORY',
    );
  }
  return true;
}
