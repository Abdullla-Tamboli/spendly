import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
    },
    overall: {
      type: Number,
      required: true,
      min: 0.01,
    },
    categories: [
      {
        category: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0.01 },
      },
    ],
  },
  { timestamps: true },
);

budgetSchema.index({ user: 1, month: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);
