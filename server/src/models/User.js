import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
    },
    lastRecurringCheck: {
      type: Date,
    },
  },
  { timestamps: true },
);

export default mongoose.model('User', userSchema);
