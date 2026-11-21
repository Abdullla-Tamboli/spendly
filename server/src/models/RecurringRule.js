import mongoose from 'mongoose';

const recurringRuleSchema = new mongoose.Schema(
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
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0.01, max: 1e9 },
    category: { type: String, required: true, trim: true },
    note: { type: String, default: '', maxlength: 200, trim: true },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: true,
    },
    nextDate: { type: Date, required: true },
    endDate: { type: Date },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

recurringRuleSchema.index({ active: 1, nextDate: 1 });
recurringRuleSchema.index({ user: 1, nextDate: 1 });

export default mongoose.model('RecurringRule', recurringRuleSchema);
