import asyncHandler from '../utils/asyncHandler.js';
import * as categoriesService from '../services/categories.js';

export const list = asyncHandler(async (req, res) => {
  const categories = await categoriesService.listCategories(req.user._id);
  res.json({ success: true, data: { categories } });
});

export const create = asyncHandler(async (req, res) => {
  const category = await categoriesService.createCategory(req.user._id, req.body);
  res.status(201).json({ success: true, data: { category } });
});

export const update = asyncHandler(async (req, res) => {
  const category = await categoriesService.updateCategory(req.user._id, req.params.id, req.body);
  res.json({ success: true, data: { category } });
});

export const remove = asyncHandler(async (req, res) => {
  await categoriesService.deleteCategory(req.user._id, req.params.id);
  res.json({ success: true, data: { message: 'Category deleted' } });
});
