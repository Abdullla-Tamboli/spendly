import mongoose from 'mongoose';
import { ALLOWED_ICONS } from '../utils/constants.js';

const categorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 30,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    icon: {
      type: String,
      enum: ALLOWED_ICONS,
      default: 'tag',
    },
  },
  { timestamps: true },
);

// Custom categories unique per (user, type, name)
categorySchema.index({ user: 1, type: 1, name: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);
