import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import env from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import accountsRouter from './routes/accounts.js';
import categoriesRouter from './routes/categories.js';

const app = express();

// ── Security headers ───────────────────────────────────────────────────────
app.use(helmet());
app.disable('x-powered-by');

// ── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl in tests)
      // but block browser requests from unlisted origins.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// ── Logging (skip during test to keep output clean) ────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── Global API rate limiter ────────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/accounts', accountsRouter);
app.use('/api/v1/categories', categoriesRouter);

// ── 404 + centralised error handler ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
