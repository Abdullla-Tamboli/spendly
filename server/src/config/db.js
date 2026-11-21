import mongoose from 'mongoose';
import env from './env.js';

const logger = { info: (msg) => process.stdout.write(`[db] ${msg}\n`) };

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info('MongoDB connected');
  } catch (err) {
    process.stderr.write(`[db] Connection failed: ${err.message}\n`);
    process.exit(1);
  }
}
