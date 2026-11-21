import 'dotenv/config';
import env from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    process.stdout.write(`[server] Spendly API listening on port ${env.PORT} (${env.NODE_ENV})\n`);
  });
}

start();
