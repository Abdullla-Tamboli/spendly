import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import EmailVerification from '../models/EmailVerification.js';
import User from '../models/User.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Registration Email OTP Verification', () => {
  const email = 'newuser@test.com';

  test('POST /auth/send-registration-otp generates and saves verification OTP', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-registration-otp')
      .send({ email });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const record = await EmailVerification.findOne({ email });
    expect(record).toBeDefined();
    expect(record.otpHash).toBeDefined();
    expect(record.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  test('POST /auth/send-registration-otp returns 409 if email is already registered', async () => {
    await User.create({ name: 'Existing', email, passwordHash: 'hash123' });

    const res = await request(app)
      .post('/api/v1/auth/send-registration-otp')
      .send({ email });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
  });

  test('POST /auth/register succeeds with valid OTP and removes verification record', async () => {
    const testOtp = '123456';
    const otpHash = await bcrypt.hash(testOtp, 10);
    await EmailVerification.create({
      email,
      otpHash,
      expiresAt: new Date(Date.now() + 60000),
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Verified User',
        email,
        password: 'Password123',
        otp: testOtp,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(email);

    // Verify OTP record was cleaned up
    const record = await EmailVerification.findOne({ email });
    expect(record).toBeNull();
  });

  test('POST /auth/register fails with incorrect OTP', async () => {
    const testOtp = '123456';
    const otpHash = await bcrypt.hash(testOtp, 10);
    await EmailVerification.create({
      email,
      otpHash,
      expiresAt: new Date(Date.now() + 60000),
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Invalid User',
        email,
        password: 'Password123',
        otp: '999999',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_OTP');
  });

  test('POST /auth/register fails with expired OTP', async () => {
    const testOtp = '123456';
    const otpHash = await bcrypt.hash(testOtp, 10);
    await EmailVerification.create({
      email,
      otpHash,
      expiresAt: new Date(Date.now() - 1000), // in the past
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Expired User',
        email,
        password: 'Password123',
        otp: testOtp,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_OTP');
  });
});
