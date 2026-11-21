import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Account from '../models/Account.js';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';

const SALT_ROUNDS = 12;

// A fixed dummy hash used to ensure constant-time comparison when user is not found.
// bcrypt.compare will still run to completion, preventing timing attacks.
const DUMMY_HASH = bcrypt.hashSync('spendly-invalid-password', SALT_ROUNDS);

function signToken(userId) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function sanitizeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    currency: user.currency,
    createdAt: user.createdAt,
  };
}

export async function registerUser({ name, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('Email is already registered', 409, 'DUPLICATE_EMAIL');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash });

  // Auto-create default accounts
  await Account.insertMany([
    { user: user._id, name: 'Cash', type: 'cash' },
    { user: user._id, name: 'Bank Account', type: 'bank' },
  ]);

  const token = signToken(user._id);
  return { token, user: sanitizeUser(user) };
}

export async function loginUser({ email, password }) {
  // Always load with passwordHash for comparison (select: false on model)
  const user = await User.findOne({ email }).select('+passwordHash');

  // Constant-time path: always run bcrypt compare
  const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
  const isMatch = await bcrypt.compare(password, hashToCompare);

  if (!user || !isMatch) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const token = signToken(user._id);
  return { token, user: sanitizeUser(user) };
}

export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return sanitizeUser(user);
}

export async function updateProfile(userId, { name, currency }) {
  const user = await User.findByIdAndUpdate(userId, { $set: { name, currency } }, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return sanitizeUser(user);
}
