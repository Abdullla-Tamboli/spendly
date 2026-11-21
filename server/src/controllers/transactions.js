import asyncHandler from '../utils/asyncHandler.js';
import * as txService from '../services/transactions.js';
import { attachFile } from '../services/attachments.js';

export const attach = asyncHandler(async (req, res) => {
  const transaction = await attachFile(req.user._id, req.params.id, req.file);
  res.json({ success: true, data: { transaction } });
});

export const list = asyncHandler(async (req, res) => {
  const result = await txService.listTransactions(req.user._id, req.query);
  res.json({ success: true, data: result.transactions, pagination: result.pagination });
});

export const getOne = asyncHandler(async (req, res) => {
  const tx = await txService.getTransaction(req.user._id, req.params.id);
  res.json({ success: true, data: { transaction: tx } });
});

export const create = asyncHandler(async (req, res) => {
  const tx = await txService.createTransaction(req.user._id, req.body);
  res.status(201).json({ success: true, data: { transaction: tx } });
});

export const update = asyncHandler(async (req, res) => {
  const tx = await txService.updateTransaction(req.user._id, req.params.id, req.body);
  res.json({ success: true, data: { transaction: tx } });
});

export const remove = asyncHandler(async (req, res) => {
  await txService.deleteTransaction(req.user._id, req.params.id);
  res.json({ success: true, data: { message: 'Transaction deleted' } });
});
