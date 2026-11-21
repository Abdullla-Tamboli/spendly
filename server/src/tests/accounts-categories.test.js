import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key in cols) await cols[key].deleteMany({});
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
  return { token: res.body?.data?.token, userId: res.body?.data?.user?._id };
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

// ── Accounts ───────────────────────────────────────────────────────────────

describe('Accounts', () => {
  it('register auto-creates Cash and Bank Account', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app).get('/api/v1/accounts').set(auth(token));
    expect(res.status).toBe(200);
    const names = res.body.data.accounts.map((a) => a.name);
    expect(names).toContain('Cash');
    expect(names).toContain('Bank Account');
  });

  it('GET /accounts returns balances and combinedTotal', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app).get('/api/v1/accounts').set(auth(token));
    expect(res.status).toBe(200);
    expect(typeof res.body.data.combinedTotal).toBe('number');
    res.body.data.accounts.forEach((a) => {
      expect(typeof a.balance).toBe('number');
    });
  });

  it('POST /accounts creates a new account', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app)
      .post('/api/v1/accounts')
      .set(auth(token))
      .send({ name: 'Savings Pot', type: 'savings' });
    expect(res.status).toBe(201);
    expect(res.body.data.account.name).toBe('Savings Pot');
    expect(res.body.data.account.type).toBe('savings');
    expect(res.body.data.account.balance).toBe(0);
  });

  it('POST /accounts rejects duplicate name', async () => {
    const { token } = await registerAndLogin();
    // 'Cash' already exists from register
    const res = await request(app)
      .post('/api/v1/accounts')
      .set(auth(token))
      .send({ name: 'Cash', type: 'wallet' });
    expect(res.status).toBe(409);
  });

  it('PUT /accounts/:id updates name and type', async () => {
    const { token } = await registerAndLogin();
    const listRes = await request(app).get('/api/v1/accounts').set(auth(token));
    const cashId = listRes.body.data.accounts.find((a) => a.name === 'Cash')._id;

    const res = await request(app)
      .put(`/api/v1/accounts/${cashId}`)
      .set(auth(token))
      .send({ name: 'Wallet Cash' });
    expect(res.status).toBe(200);
    expect(res.body.data.account.name).toBe('Wallet Cash');
  });

  it('DELETE /accounts/:id fails when account has transactions', async () => {
    const { token } = await registerAndLogin();
    const listRes = await request(app).get('/api/v1/accounts').set(auth(token));
    const cashId = listRes.body.data.accounts.find((a) => a.name === 'Cash')._id;

    // Insert a transaction directly into the DB
    const Transaction = (await import('../models/Transaction.js')).default;
    const User = (await import('../models/User.js')).default;
    const user = await User.findOne({ email: 'test@example.com' });
    await Transaction.create({
      user: user._id,
      account: cashId,
      type: 'income',
      amount: 100,
      category: 'Salary',
      date: new Date(),
    });

    const res = await request(app)
      .delete(`/api/v1/accounts/${cashId}`)
      .set(auth(token));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ACCOUNT_HAS_TRANSACTIONS');
  });

  it('DELETE /accounts/:id removes an empty account', async () => {
    const { token } = await registerAndLogin();
    // Create a new empty account
    const createRes = await request(app)
      .post('/api/v1/accounts')
      .set(auth(token))
      .send({ name: 'Temp', type: 'wallet' });
    const id = createRes.body.data.account._id;

    const res = await request(app).delete(`/api/v1/accounts/${id}`).set(auth(token));
    expect(res.status).toBe(200);
  });

  it('PUT /accounts/:id returns 404 for another users account', async () => {
    const { token: tokenA } = await registerAndLogin();
    const { token: tokenB } = await registerAndLogin({ email: 'b@example.com' });

    const listA = await request(app).get('/api/v1/accounts').set(auth(tokenA));
    const cashIdA = listA.body.data.accounts[0]._id;

    const res = await request(app)
      .put(`/api/v1/accounts/${cashIdA}`)
      .set(auth(tokenB))
      .send({ name: 'Hacked' });
    expect(res.status).toBe(404);
  });
});

// ── Categories ─────────────────────────────────────────────────────────────

describe('Categories', () => {
  it('treats category regex characters literally and preserves references after rename', async () => {
    const { token } = await registerAndLogin();
    const created = await request(app).post('/api/v1/categories').set(auth(token)).send({ name: 'Coffee (work)', type: 'expense' });
    const accounts = await request(app).get('/api/v1/accounts').set(auth(token));
    const payload = { account: accounts.body.data.accounts[0]._id, type: 'expense', amount: 10, category: 'Coffee (work)' };
    expect((await request(app).post('/api/v1/transactions').set(auth(token)).send(payload)).status).toBe(201);
    expect((await request(app).post('/api/v1/transactions').set(auth(token)).send({ ...payload, category: '.*' })).status).toBe(400);
    await request(app).put(`/api/v1/categories/${created.body.data.category._id}`).set(auth(token)).send({ name: 'Work coffee' });
    const list = await request(app).get('/api/v1/transactions').set(auth(token));
    expect(list.body.data[0].category).toBe('Work coffee');
  });
  it('GET /categories returns default + custom categories', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app).get('/api/v1/categories').set(auth(token));
    expect(res.status).toBe(200);
    const names = res.body.data.categories.map((c) => c.name);
    expect(names).toContain('Food');
    expect(names).toContain('Salary');
  });

  it('POST /categories creates a custom category', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app)
      .post('/api/v1/categories')
      .set(auth(token))
      .send({ name: 'Side Hustle', type: 'income', icon: 'briefcase' });
    expect(res.status).toBe(201);
    expect(res.body.data.category.name).toBe('Side Hustle');
    expect(res.body.data.category.isDefault).toBe(false);
  });

  it('POST /categories rejects a name that matches a default', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app)
      .post('/api/v1/categories')
      .set(auth(token))
      .send({ name: 'Food', type: 'expense' });
    expect(res.status).toBe(409);
  });

  it('PUT /categories/:id updates name', async () => {
    const { token } = await registerAndLogin();
    const createRes = await request(app)
      .post('/api/v1/categories')
      .set(auth(token))
      .send({ name: 'Misc', type: 'expense' });
    const id = createRes.body.data.category._id;

    const res = await request(app)
      .put(`/api/v1/categories/${id}`)
      .set(auth(token))
      .send({ name: 'Miscellaneous' });
    expect(res.status).toBe(200);
    expect(res.body.data.category.name).toBe('Miscellaneous');
  });

  it('DELETE /categories/:id rejects category in use', async () => {
    const { token } = await registerAndLogin();
    const createRes = await request(app)
      .post('/api/v1/categories')
      .set(auth(token))
      .send({ name: 'Side Hustle', type: 'income' });
    const catId = createRes.body.data.category._id;

    const listAcc = await request(app).get('/api/v1/accounts').set(auth(token));
    const cashId = listAcc.body.data.accounts[0]._id;

    // Create a transaction using this category
    const Transaction = (await import('../models/Transaction.js')).default;
    const User = (await import('../models/User.js')).default;
    const user = await User.findOne({ email: 'test@example.com' });
    await Transaction.create({
      user: user._id,
      account: cashId,
      type: 'income',
      amount: 50,
      category: 'Side Hustle',
      date: new Date(),
    });

    const res = await request(app).delete(`/api/v1/categories/${catId}`).set(auth(token));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_IN_USE');
  });

  it('DELETE /categories/:id removes unused category', async () => {
    const { token } = await registerAndLogin();
    const createRes = await request(app)
      .post('/api/v1/categories')
      .set(auth(token))
      .send({ name: 'Unused Cat', type: 'expense' });
    const id = createRes.body.data.category._id;
    const res = await request(app).delete(`/api/v1/categories/${id}`).set(auth(token));
    expect(res.status).toBe(200);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(401);
  });
});
