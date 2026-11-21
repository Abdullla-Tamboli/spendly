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

async function setupUser(email) {
  const reg = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'User', email, password: 'Password1' });
  const token = reg.body.data.token;
  const listAcc = await request(app)
    .get('/api/v1/accounts')
    .set('Authorization', `Bearer ${token}`);
  const cashId = listAcc.body.data.accounts.find((a) => a.name === 'Cash')._id;
  return { token, cashId };
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

async function createTx(token, cashId, overrides = {}) {
  const res = await request(app)
    .post('/api/v1/transactions')
    .set(auth(token))
    .send({ account: cashId, type: 'expense', amount: 25, category: 'Food', ...overrides });
  return res.body?.data?.transaction;
}

// ── Cross-user isolation: Transactions ────────────────────────────────────

describe('User isolation — Transactions', () => {
  it("User B cannot GET User A's transaction → 404", async () => {
    const { token: tokenA, cashId: cashA } = await setupUser('a@example.com');
    const { token: tokenB } = await setupUser('b@example.com');

    const tx = await createTx(tokenA, cashA);
    const res = await request(app)
      .get(`/api/v1/transactions/${tx._id}`)
      .set(auth(tokenB));
    expect(res.status).toBe(404);
  });

  it("User B cannot PUT User A's transaction → 404", async () => {
    const { token: tokenA, cashId: cashA } = await setupUser('a@example.com');
    const { token: tokenB } = await setupUser('b@example.com');

    const tx = await createTx(tokenA, cashA);
    const res = await request(app)
      .put(`/api/v1/transactions/${tx._id}`)
      .set(auth(tokenB))
      .send({ note: 'Hacked' });
    expect(res.status).toBe(404);
  });

  it("User B cannot DELETE User A's transaction → 404", async () => {
    const { token: tokenA, cashId: cashA } = await setupUser('a@example.com');
    const { token: tokenB } = await setupUser('b@example.com');

    const tx = await createTx(tokenA, cashA);
    const del = await request(app)
      .delete(`/api/v1/transactions/${tx._id}`)
      .set(auth(tokenB));
    expect(del.status).toBe(404);

    // A's data must be unchanged
    const get = await request(app)
      .get(`/api/v1/transactions/${tx._id}`)
      .set(auth(tokenA));
    expect(get.status).toBe(200);
    expect(get.body.data.transaction._id).toBe(tx._id);
  });

  it("User B's transaction list never contains User A's transactions", async () => {
    const { token: tokenA, cashId: cashA } = await setupUser('a@example.com');
    const { token: tokenB } = await setupUser('b@example.com');

    await createTx(tokenA, cashA, { note: 'secret-a' });
    await createTx(tokenA, cashA, { note: 'secret-a2' });

    const res = await request(app)
      .get('/api/v1/transactions')
      .set(auth(tokenB));
    expect(res.status).toBe(200);
    const notes = res.body.data.map((t) => t.note);
    expect(notes).not.toContain('secret-a');
    expect(notes).not.toContain('secret-a2');
  });

  it("User B cannot create a transaction using User A's account ID → 404", async () => {
    const { cashId: cashA } = await setupUser('a@example.com');
    const { token: tokenB } = await setupUser('b@example.com');

    const res = await request(app)
      .post('/api/v1/transactions')
      .set(auth(tokenB))
      .send({ account: cashA, type: 'expense', amount: 10, category: 'Food' });
    expect(res.status).toBe(404);
  });
});

// ── Cross-user isolation: Accounts ────────────────────────────────────────

describe('User isolation — Accounts', () => {
  it("User B cannot PUT User A's account → 404", async () => {
    const { cashId: cashA } = await setupUser('a@example.com');
    const { token: tokenB } = await setupUser('b@example.com');

    const res = await request(app)
      .put(`/api/v1/accounts/${cashA}`)
      .set(auth(tokenB))
      .send({ name: 'Hacked' });
    expect(res.status).toBe(404);
  });

  it("User B cannot DELETE User A's account → 404", async () => {
    const { token: tokenA } = await setupUser('a@example.com');
    const { token: tokenB } = await setupUser('b@example.com');

    const newAcc = await request(app)
      .post('/api/v1/accounts')
      .set(auth(tokenA))
      .send({ name: 'Extra', type: 'wallet' });
    const accId = newAcc.body.data.account._id;

    const res = await request(app)
      .delete(`/api/v1/accounts/${accId}`)
      .set(auth(tokenB));
    expect(res.status).toBe(404);
  });

  it("User B's account list only contains their own accounts", async () => {
    const { token: tokenA } = await setupUser('a@example.com');
    const { token: tokenB } = await setupUser('b@example.com');

    await request(app)
      .post('/api/v1/accounts')
      .set(auth(tokenA))
      .send({ name: 'Secret Account', type: 'savings' });

    const res = await request(app).get('/api/v1/accounts').set(auth(tokenB));
    const names = res.body.data.accounts.map((a) => a.name);
    expect(names).not.toContain('Secret Account');
  });
});

// ── Cross-user isolation: Categories ──────────────────────────────────────

describe('User isolation — Categories', () => {
  it("User B cannot PUT User A's custom category → 404", async () => {
    const { token: tokenA } = await setupUser('a@example.com');
    const { token: tokenB } = await setupUser('b@example.com');

    const cat = await request(app)
      .post('/api/v1/categories')
      .set(auth(tokenA))
      .send({ name: 'Secret Cat', type: 'expense' });
    const catId = cat.body.data.category._id;

    const res = await request(app)
      .put(`/api/v1/categories/${catId}`)
      .set(auth(tokenB))
      .send({ name: 'Hacked' });
    expect(res.status).toBe(404);
  });

  it("User B cannot DELETE User A's custom category → 404", async () => {
    const { token: tokenA } = await setupUser('a@example.com');
    const { token: tokenB } = await setupUser('b@example.com');

    const cat = await request(app)
      .post('/api/v1/categories')
      .set(auth(tokenA))
      .send({ name: 'Secret Cat2', type: 'expense' });
    const catId = cat.body.data.category._id;

    const res = await request(app)
      .delete(`/api/v1/categories/${catId}`)
      .set(auth(tokenB));
    expect(res.status).toBe(404);
  });
});
