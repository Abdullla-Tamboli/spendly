import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
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
      maxlength: 40,
    },
    type: {
      type: String,
      enum: ['cash', 'bank', 'credit_card', 'wallet', 'savings'],
      required: true,
    },
  },
  { timestamps: true },
);

// Unique account name per user
accountSchema.index({ user: 1, name: 1 }, { unique: true });

export default mongoose.model('Account', accountSchema);
