import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../app.js';
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

describe('OTP Authentication', () => {
  const email = 'otpuser@test.com';

  beforeEach(async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'OTP User', email, password: 'Password123' });
  });

  test('POST /auth/send-otp generates an OTP and saves hash on user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ email });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await User.findOne({ email }).select('+loginOtpHash +loginOtpExpires');
    expect(user.loginOtpHash).toBeDefined();
    expect(user.loginOtpExpires).toBeDefined();
    expect(user.loginOtpExpires.getTime()).toBeGreaterThan(Date.now());
  });

  test('POST /auth/send-otp with non-existent email returns 200 without leaking', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ email: 'nonexistent@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /auth/verify-otp succeeds with valid OTP and clears OTP hash', async () => {
    // Send OTP
    await request(app).post('/api/v1/auth/send-otp').send({ email });

    // In test environment, the generated OTP can be verified by logging or inspecting user hash
    // We can directly set a known OTP hash on user to test verification
    const bcrypt = (await import('bcryptjs')).default;
    const testOtp = '654321';
    const hash = await bcrypt.hash(testOtp, 10);
    await User.findOneAndUpdate(
      { email },
      { loginOtpHash: hash, loginOtpExpires: new Date(Date.now() + 60000) },
    );

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ email, otp: testOtp });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(email);

    // Verify OTP was cleared
    const user = await User.findOne({ email }).select('+loginOtpHash +loginOtpExpires');
    expect(user.loginOtpHash).toBeUndefined();
  });

  test('POST /auth/verify-otp fails with incorrect OTP', async () => {
    const bcrypt = (await import('bcryptjs')).default;
    const testOtp = '112233';
    const hash = await bcrypt.hash(testOtp, 10);
    await User.findOneAndUpdate(
      { email },
      { loginOtpHash: hash, loginOtpExpires: new Date(Date.now() + 60000) },
    );

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ email, otp: '999999' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_OTP');
  });

  test('POST /auth/verify-otp fails with expired OTP', async () => {
    const bcrypt = (await import('bcryptjs')).default;
    const testOtp = '112233';
    const hash = await bcrypt.hash(testOtp, 10);
    await User.findOneAndUpdate(
      { email },
      { loginOtpHash: hash, loginOtpExpires: new Date(Date.now() - 1000) }, // in the past
    );

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ email, otp: testOtp });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('EXPIRED_OTP');
  });

  test('POST /auth/verify-otp rejects invalid OTP format (non-numeric or not 6 digits)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ email, otp: 'abc' });

    expect(res.status).toBe(400);
  });
});
