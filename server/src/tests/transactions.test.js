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

async function setup(email = 'test@example.com') {
  const reg = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Test', email, password: 'Password1' });
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
  return request(app)
    .post('/api/v1/transactions')
    .set(auth(token))
    .send({
      account: cashId,
      type: 'expense',
      amount: 25,
      category: 'Food',
      note: 'Lunch',
      ...overrides,
    });
}

// ── CRUD ───────────────────────────────────────────────────────────────────

describe('Transactions CRUD', () => {
  it('rejects impossible dates, unordered filters and incomplete recurring settings', async () => {
    const { token, cashId } = await setup();
    for (const date of [null, '2026-02-30', 'not-a-date']) {
      expect((await createTx(token, cashId, { date })).status).toBe(400);
    }
    expect((await createTx(token, cashId, { recurring: { enabled: true } })).status).toBe(400);
    expect((await request(app).get('/api/v1/transactions?from=2026-07-02&to=2026-07-01').set(auth(token))).status).toBe(400);
    expect((await request(app).get('/api/v1/transactions?minAmount=20&maxAmount=10').set(auth(token))).status).toBe(400);
    expect((await request(app).get('/api/v1/transactions?unknown=true').set(auth(token))).status).toBe(400);
    const tx = await createTx(token, cashId, { category: 'food' });
    expect(tx.body.data.transaction.category).toBe('Food');
    const attachment = await request(app).post(`/api/v1/transactions/${tx.body.data.transaction._id}/attachment`).set(auth(token));
    expect(attachment.status).toBe(501);
    expect(attachment.body.error.code).toBe('ATTACHMENTS_UNAVAILABLE');
  });
  it('POST creates a transaction and returns populated account', async () => {
    const { token, cashId } = await setup();
    const res = await createTx(token, cashId);
    expect(res.status).toBe(201);
    expect(res.body.data.transaction.amount).toBe(25);
    expect(res.body.data.transaction.category).toBe('Food');
    expect(res.body.data.transaction.account._id).toBe(cashId);
    expect(res.body.data.transaction.account.name).toBe('Cash');
  });

  it('POST defaults date to today when omitted', async () => {
    const { token, cashId } = await setup();
    const res = await createTx(token, cashId);
    const txDate = new Date(res.body.data.transaction.date);
    const today = new Date();
    expect(txDate.toDateString()).toBe(today.toDateString());
  });

  it('GET /:id returns a single transaction', async () => {
    const { token, cashId } = await setup();
    const create = await createTx(token, cashId);
    const id = create.body.data.transaction._id;
    const res = await request(app).get(`/api/v1/transactions/${id}`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.transaction._id).toBe(id);
  });

  it('PUT /:id updates a transaction', async () => {
    const { token, cashId } = await setup();
    const create = await createTx(token, cashId);
    const id = create.body.data.transaction._id;
    const res = await request(app)
      .put(`/api/v1/transactions/${id}`)
      .set(auth(token))
      .send({ amount: 50, note: 'Dinner' });
    expect(res.status).toBe(200);
    expect(res.body.data.transaction.amount).toBe(50);
    expect(res.body.data.transaction.note).toBe('Dinner');
  });

  it('DELETE /:id removes a transaction', async () => {
    const { token, cashId } = await setup();
    const create = await createTx(token, cashId);
    const id = create.body.data.transaction._id;
    const del = await request(app).delete(`/api/v1/transactions/${id}`).set(auth(token));
    expect(del.status).toBe(200);
    const get = await request(app).get(`/api/v1/transactions/${id}`).set(auth(token));
    expect(get.status).toBe(404);
  });
});

// ── Validation ─────────────────────────────────────────────────────────────

describe('Transaction validation', () => {
  it('rejects negative amount', async () => {
    const { token, cashId } = await setup();
    const res = await createTx(token, cashId, { amount: -10 });
    expect(res.status).toBe(400);
  });

  it('rejects amount > 2 decimal places', async () => {
    const { token, cashId } = await setup();
    const res = await createTx(token, cashId, { amount: 10.123 });
    expect(res.status).toBe(400);
  });

  it('rejects unknown category', async () => {
    const { token, cashId } = await setup();
    const res = await createTx(token, cashId, { category: 'NoSuchCategory' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_CATEGORY');
  });

  it('rejects extra fields (strict schema)', async () => {
    const { token, cashId } = await setup();
    const res = await createTx(token, cashId, { rogue: 'field' });
    expect(res.status).toBe(400);
  });

  it('rejects limit > 100', async () => {
    const { token } = await setup();
    const res = await request(app)
      .get('/api/v1/transactions?limit=101')
      .set(auth(token));
    expect(res.status).toBe(400);
  });
});

// ── Pagination ─────────────────────────────────────────────────────────────

describe('Transaction pagination', () => {
  it('returns correct page, limit, total, totalPages', async () => {
    const { token, cashId } = await setup();
    // Create 5 transactions
    for (let i = 0; i < 5; i++) {
      await createTx(token, cashId, { amount: i + 1, note: `tx${i}` });
    }
    const res = await request(app)
      .get('/api/v1/transactions?page=1&limit=2')
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.totalPages).toBe(3);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(2);
  });

  it('page 2 returns next slice', async () => {
    const { token, cashId } = await setup();
    for (let i = 0; i < 5; i++) {
      await createTx(token, cashId, { amount: i + 1 });
    }
    const res = await request(app)
      .get('/api/v1/transactions?page=2&limit=2')
      .set(auth(token));
    expect(res.body.data.length).toBe(2);
  });
});

// ── Filters + Search ───────────────────────────────────────────────────────

describe('Transaction filters and search', () => {
  it('filters by type', async () => {
    const { token, cashId } = await setup();
    await createTx(token, cashId, { type: 'income', category: 'Salary', amount: 1000 });
    await createTx(token, cashId, { type: 'expense', category: 'Food', amount: 25 });
    const res = await request(app)
      .get('/api/v1/transactions?type=income')
      .set(auth(token));
    expect(res.body.data.every((t) => t.type === 'income')).toBe(true);
  });

  it('filters by category (comma-separated)', async () => {
    const { token, cashId } = await setup();
    await createTx(token, cashId, { category: 'Food' });
    await createTx(token, cashId, { category: 'Travel' });
    await createTx(token, cashId, { category: 'Shopping' });
    const res = await request(app)
      .get('/api/v1/transactions?category=Food,Travel')
      .set(auth(token));
    expect(res.body.data.length).toBe(2);
    res.body.data.forEach((t) => expect(['Food', 'Travel']).toContain(t.category));
  });

  it('filters by date range (from + to)', async () => {
    const { token, cashId } = await setup();
    await createTx(token, cashId, { date: '2024-01-15', amount: 10 });
    await createTx(token, cashId, { date: '2024-06-01', amount: 20 });
    await createTx(token, cashId, { date: '2024-12-31', amount: 30 });
    const res = await request(app)
      .get('/api/v1/transactions?from=2024-01-01&to=2024-06-30')
      .set(auth(token));
    expect(res.body.data.length).toBe(2);
  });

  it('filters by minAmount and maxAmount', async () => {
    const { token, cashId } = await setup();
    await createTx(token, cashId, { amount: 5 });
    await createTx(token, cashId, { amount: 50 });
    await createTx(token, cashId, { amount: 500 });
    const res = await request(app)
      .get('/api/v1/transactions?minAmount=10&maxAmount=100')
      .set(auth(token));
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].amount).toBe(50);
  });

  it('searches by note', async () => {
    const { token, cashId } = await setup();
    await createTx(token, cashId, { note: 'Pizza night' });
    await createTx(token, cashId, { note: 'Gym membership' });
    const res = await request(app)
      .get('/api/v1/transactions?search=pizza')
      .set(auth(token));
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].note).toBe('Pizza night');
  });

  it('searches by amount (numeric search)', async () => {
    const { token, cashId } = await setup();
    await createTx(token, cashId, { amount: 99.99 });
    await createTx(token, cashId, { amount: 42 });
    const res = await request(app)
      .get('/api/v1/transactions?search=42')
      .set(auth(token));
    expect(res.body.data.some((t) => t.amount === 42)).toBe(true);
  });

  it('combined filter: type + category + date range + amount range', async () => {
    const { token, cashId } = await setup();
    await createTx(token, cashId, { type: 'expense', category: 'Food', amount: 30, date: '2024-03-10' });
    await createTx(token, cashId, { type: 'expense', category: 'Travel', amount: 30, date: '2024-03-10' });
    await createTx(token, cashId, { type: 'income', category: 'Salary', amount: 1000, date: '2024-03-10' });
    const res = await request(app)
      .get('/api/v1/transactions?type=expense&category=Food&from=2024-01-01&to=2024-12-31&minAmount=10&maxAmount=50')
      .set(auth(token));
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].category).toBe('Food');
  });
});

// ── CSV Export ─────────────────────────────────────────────────────────────

describe('CSV Export', () => {
  it('returns correct Content-Type and header row', async () => {
    const { token, cashId } = await setup();
    await createTx(token, cashId, { amount: 25, note: 'Lunch' });
    const res = await request(app)
      .get('/api/v1/transactions/export')
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text.startsWith('Date,Type,Category,Account,Amount,Note')).toBe(true);
  });

  it('CSV injection: note starting with = is prefixed with quote', async () => {
    const { token, cashId } = await setup();
    await createTx(token, cashId, { note: '=cmd|calc.exe' });
    const res = await request(app)
      .get('/api/v1/transactions/export')
      .set(auth(token));
    expect(res.text).toContain("'=cmd|calc.exe");
  });

  it('honours filters (only exports matching transactions)', async () => {
    const { token, cashId } = await setup();
    await createTx(token, cashId, { type: 'income', category: 'Salary', amount: 1000 });
    await createTx(token, cashId, { type: 'expense', category: 'Food', amount: 25 });
    const res = await request(app)
      .get('/api/v1/transactions/export?type=income')
      .set(auth(token));
    const rows = res.text.trim().split('\n');
    expect(rows.length).toBe(2); // header + 1 row
    expect(rows[1]).toMatch(/Income/);
  });
});
