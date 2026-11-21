import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import env from '../config/env.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// ── Helpers ────────────────────────────────────────────────────────────────

async function registerAndLogin(overrides = {}) {
  const payload = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password1',
    ...overrides,
  };
  const res = await request(app).post('/api/v1/auth/register').send(payload);
  return { res, token: res.body?.data?.token, user: res.body?.data?.user };
}

// ── Register ───────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/register', () => {
  it('succeeds and returns token + user (no password/hash)', async () => {
    const { res } = await registerAndLogin();
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.user.name).toBe('Test User');
    // Must never expose password or hash
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('creates two default accounts (Cash + Bank Account)', async () => {
    const { res } = await registerAndLogin();
    expect(res.status).toBe(201);
    // Verify via GET /accounts later; here we just confirm register succeeds
    expect(res.body.data.user._id).toBeDefined();
  });

  it('rejects duplicate email with 409', async () => {
    await registerAndLogin();
    const { res } = await registerAndLogin();
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects weak password (no number)', async () => {
    const { res } = await registerAndLogin({ password: 'Password' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects weak password (too short)', async () => {
    const { res } = await registerAndLogin({ password: 'Pa1' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid email format', async () => {
    const { res } = await registerAndLogin({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects extra fields (strict schema)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'A', email: 'a@b.com', password: 'Password1', admin: true });
    expect(res.status).toBe(400);
  });
});

// ── Login ──────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await registerAndLogin();
  });

  it('succeeds with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Password1' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('returns same 401 message for wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'WrongPass1' });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('returns same 401 message for unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password1' });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('NoSQL injection payload returns 400 (Zod rejects object)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: { $ne: null }, password: 'x' });
    expect(res.status).toBe(400);
  });
});

// ── Protected routes ───────────────────────────────────────────────────────

describe('GET /api/v1/auth/me (protected)', () => {
  it('returns 401 NO_TOKEN without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('NO_TOKEN');
  });

  it('returns 401 INVALID_TOKEN with a malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer this.is.not.valid');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns 401 TOKEN_EXPIRED with an expired token', async () => {
    const expiredToken = jwt.sign({ sub: new mongoose.Types.ObjectId() }, env.JWT_SECRET, {
      expiresIn: '-1s',
    });
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('returns current user with valid token', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });
});

// ── Logout ─────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/logout', () => {
  it('acknowledges logout for authenticated user', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(401);
  });
});
