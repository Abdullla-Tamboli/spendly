import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
      max: 1e9,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      default: '',
      maxlength: 200,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    attachment: {
      url: String,
      publicId: String,
      mimeType: String,
    },
    recurringRule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurringRule',
    },
  },
  { timestamps: true },
);

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1, date: -1 });
transactionSchema.index({ user: 1, account: 1, date: -1 });

export default mongoose.model('Transaction', transactionSchema);
