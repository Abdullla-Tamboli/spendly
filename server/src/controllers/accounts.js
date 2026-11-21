import asyncHandler from '../utils/asyncHandler.js';
import * as accountsService from '../services/accounts.js';

export const list = asyncHandler(async (req, res) => {
  const data = await accountsService.listAccounts(req.user._id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const account = await accountsService.createAccount(req.user._id, req.body);
  res.status(201).json({ success: true, data: { account } });
});

export const update = asyncHandler(async (req, res) => {
  const account = await accountsService.updateAccount(req.user._id, req.params.id, req.body);
  res.json({ success: true, data: { account } });
});

export const remove = asyncHandler(async (req, res) => {
  await accountsService.deleteAccount(req.user._id, req.params.id);
  res.json({ success: true, data: { message: 'Account deleted' } });
});
