import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../app.js';
import { computeBudgetLevel } from '../services/budgets.js';

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

// ── Inline helpers ─────────────────────────────────────────────────────────
let _counter = 0;
async function setup(suffix) {
  const id = suffix ?? ++_counter;
  const email = `user${id}@test.com`;
  const reg = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Test User', email, password: 'Password1' });
  const token = reg.body.data.token;
  const accRes = await request(app)
    .get('/api/v1/accounts')
    .set('Authorization', `Bearer ${token}`);
  const cashId = accRes.body.data.accounts[0]._id;
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
      amount: 100,
      category: 'Food',
      note: '',
      date: new Date().toISOString(),
      ...overrides,
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// BUDGET LEVEL CALCULATION
// ═══════════════════════════════════════════════════════════════════════════
describe('Budget level computation', () => {
  test('does not warn early when rounding below a threshold', () => {
    expect(computeBudgetLevel(49.99, 100, 'July').level).toBe('ok');
    expect(computeBudgetLevel(99.99, 100, 'July').level).toBe('danger');
  });
  test('uses UTC month boundaries and rejects invalid category budgets', async () => {
    const { token, cashId } = await setup();
    await createTx(token, cashId, { date: '2026-07-31T23:59:59.000Z', amount: 17 });
    await createTx(token, cashId, { date: '2026-08-01T00:00:00.000Z', amount: 23 });
    const res = await request(app).get('/api/v1/budgets?month=2026-07').set(auth(token));
    expect(res.body.data.spent).toBe(17);
    expect((await request(app).get('/api/v1/budgets?month=2026-13').set(auth(token))).status).toBe(400);
    expect((await request(app).put('/api/v1/budgets/2026-07').set(auth(token)).send({ overall: 100, categories: [{ category: 'Unknown', amount: 10 }] })).status).toBe(400);
  });
  async function setOverallBudget(tk, amount, month) {
    return request(app)
      .put(`/api/v1/budgets/${month}`)
      .set(auth(tk))
      .send({ overall: amount, categories: [] });
  }

  test('level = ok when spent is 0 (< 50%)', async () => {
    const { token } = await setup();
    const month = new Date().toISOString().slice(0, 7);
    await setOverallBudget(token, 1000, month);
    const res = await request(app)
      .get(`/api/v1/budgets?month=${month}`)
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.level).toBe('ok');
    expect(res.body.data.percentUsed).toBe(0);
  });

  test('level = info when spent >= 50%', async () => {
    const { token, cashId } = await setup();
    const month = new Date().toISOString().slice(0, 7);
    await setOverallBudget(token, 100, month);
    await createTx(token, cashId, { amount: 50, type: 'expense', category: 'Food' });
    const res = await request(app)
      .get(`/api/v1/budgets?month=${month}`)
      .set(auth(token));
    expect(res.body.data.level).toBe('info');
    expect(res.body.data.percentUsed).toBe(50);
  });

  test('level = warning when spent >= 75%', async () => {
    const { token, cashId } = await setup();
    const month = new Date().toISOString().slice(0, 7);
    await setOverallBudget(token, 100, month);
    await createTx(token, cashId, { amount: 75, type: 'expense', category: 'Food' });
    const res = await request(app)
      .get(`/api/v1/budgets?month=${month}`)
      .set(auth(token));
    expect(res.body.data.level).toBe('warning');
  });

  test('level = danger when spent >= 90%', async () => {
    const { token, cashId } = await setup();
    const month = new Date().toISOString().slice(0, 7);
    await setOverallBudget(token, 100, month);
    await createTx(token, cashId, { amount: 90, type: 'expense', category: 'Food' });
    const res = await request(app)
      .get(`/api/v1/budgets?month=${month}`)
      .set(auth(token));
    expect(res.body.data.level).toBe('danger');
  });

  test('level = exceeded when spent >= 100% with correct message', async () => {
    const { token, cashId } = await setup();
    const month = new Date().toISOString().slice(0, 7);
    await setOverallBudget(token, 100, month);
    await createTx(token, cashId, { amount: 150, type: 'expense', category: 'Food' });
    const res = await request(app)
      .get(`/api/v1/budgets?month=${month}`)
      .set(auth(token));
    expect(res.body.data.level).toBe('exceeded');
    expect(res.body.data.message).toMatch(/exceeded by/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BUDGET CRUD
// ═══════════════════════════════════════════════════════════════════════════
describe('Budget CRUD', () => {
  const month = '2025-06';

  test('GET budget for month with no data returns hasBudget=false and overall=0', async () => {
    const { token } = await setup();
    const res = await request(app)
      .get(`/api/v1/budgets?month=${month}`)
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.hasBudget).toBe(false);
    expect(res.body.data.overall).toBe(0);
  });

  test('PUT upserts budget and returns computed status', async () => {
    const { token } = await setup();
    const res = await request(app)
      .put(`/api/v1/budgets/${month}`)
      .set(auth(token))
      .send({ overall: 500, categories: [{ category: 'Food', amount: 200 }] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overall).toBe(500);
    expect(res.body.data.categories).toHaveLength(1);
    expect(res.body.data.categories[0].category).toBe('Food');
    expect(res.body.data.hasBudget).toBe(true);
  });

  test('PUT updates existing budget (upsert)', async () => {
    const { token } = await setup();
    await request(app)
      .put(`/api/v1/budgets/${month}`)
      .set(auth(token))
      .send({ overall: 500, categories: [] });
    const res = await request(app)
      .put(`/api/v1/budgets/${month}`)
      .set(auth(token))
      .send({ overall: 800, categories: [] });
    expect(res.body.data.overall).toBe(800);
  });

  test('DELETE removes budget and subsequent GET returns hasBudget=false', async () => {
    const { token } = await setup();
    await request(app)
      .put(`/api/v1/budgets/${month}`)
      .set(auth(token))
      .send({ overall: 300, categories: [] });
    const del = await request(app)
      .delete(`/api/v1/budgets/${month}`)
      .set(auth(token));
    expect(del.status).toBe(200);
    const get = await request(app)
      .get(`/api/v1/budgets?month=${month}`)
      .set(auth(token));
    expect(get.body.data.hasBudget).toBe(false);
  });

  test('DELETE non-existent budget → 404', async () => {
    const { token } = await setup();
    const res = await request(app)
      .delete('/api/v1/budgets/2020-01')
      .set(auth(token));
    expect(res.status).toBe(404);
  });

  test('PUT with invalid month format → 422', async () => {
    const { token } = await setup();
    const res = await request(app)
      .put('/api/v1/budgets/bad-month')
      .set(auth(token))
      .send({ overall: 500, categories: [] });
    expect(res.status).toBe(400);
  });

  test('PUT requires auth → 401', async () => {
    const res = await request(app)
      .put(`/api/v1/budgets/${month}`)
      .send({ overall: 500 });
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════
describe('Analytics', () => {
  test('returns summary, categoryBreakdown, trend for range=month', async () => {
    const { token, cashId } = await setup();
    await createTx(token, cashId, { type: 'income', amount: 1000, category: 'Salary' });
    await createTx(token, cashId, { type: 'expense', amount: 300, category: 'Food' });
    await createTx(token, cashId, { type: 'expense', amount: 100, category: 'Travel' });

    const res = await request(app)
      .get('/api/v1/analytics?range=month')
      .set(auth(token));
    expect(res.status).toBe(200);
    const { summary, categoryBreakdown, trend } = res.body.data;

    expect(summary.income).toBe(1000);
    expect(summary.expenses).toBe(400);
    expect(summary.netSavings).toBe(600);

    expect(categoryBreakdown).toHaveLength(2);
    const food = categoryBreakdown.find((c) => c.category === 'Food');
    expect(food.amount).toBe(300);
    expect(food.percentage).toBe(75); // 300/400 * 100

    expect(Array.isArray(trend)).toBe(true);
    expect(trend.length).toBeGreaterThan(0);
  });

  test('range=week returns trend with <= 7 buckets', async () => {
    const { token } = await setup();
    const res = await request(app)
      .get('/api/v1/analytics?range=week')
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.trend.length).toBeLessThanOrEqual(7);
  });

  test('range=year returns trend with 12 buckets', async () => {
    const { token } = await setup();
    const res = await request(app)
      .get('/api/v1/analytics?range=year')
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.trend).toHaveLength(12);
  });

  test('invalid range → 422', async () => {
    const { token } = await setup();
    const res = await request(app)
      .get('/api/v1/analytics?range=bad')
      .set(auth(token));
    expect(res.status).toBe(400);
  });

  test('no range param defaults to month (200)', async () => {
    const { token } = await setup();
    const res = await request(app)
      .get('/api/v1/analytics')
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('summary');
  });

  test('analytics requires auth → 401', async () => {
    const res = await request(app).get('/api/v1/analytics?range=month');
    expect(res.status).toBe(401);
  });

  test('empty data returns zeroed summary and empty categoryBreakdown', async () => {
    const { token } = await setup();
    const res = await request(app)
      .get('/api/v1/analytics?range=month')
      .set(auth(token));
    expect(res.body.data.summary.income).toBe(0);
    expect(res.body.data.summary.expenses).toBe(0);
    expect(res.body.data.summary.netSavings).toBe(0);
    expect(res.body.data.categoryBreakdown).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
describe('Dashboard', () => {
  test('returns required fields with no transactions', async () => {
    const { token } = await setup();
    const res = await request(app)
      .get('/api/v1/dashboard')
      .set(auth(token));
    expect(res.status).toBe(200);
    const { data } = res.body;
    expect(data).toHaveProperty('totalIncome');
    expect(data).toHaveProperty('totalExpenses');
    expect(data).toHaveProperty('balance');
    expect(data).toHaveProperty('budget');
    expect(data).toHaveProperty('recentTransactions');
    expect(data).toHaveProperty('overview');
    expect(data.totalIncome).toBe(0);
    expect(data.totalExpenses).toBe(0);
    expect(data.balance).toBe(0);
    expect(Array.isArray(data.recentTransactions)).toBe(true);
    expect(Array.isArray(data.overview)).toBe(true);
  });

  test('overview always has 6 entries (one per month)', async () => {
    const { token } = await setup();
    const res = await request(app)
      .get('/api/v1/dashboard')
      .set(auth(token));
    expect(res.body.data.overview).toHaveLength(6);
  });

  test('computed totals are correct with known transactions', async () => {
    const { token, cashId } = await setup();
    await createTx(token, cashId, { type: 'income', amount: 2000, category: 'Salary' });
    await createTx(token, cashId, { type: 'expense', amount: 500, category: 'Food' });
    await createTx(token, cashId, { type: 'expense', amount: 300, category: 'Travel' });

    const res = await request(app)
      .get('/api/v1/dashboard')
      .set(auth(token));
    const { data } = res.body;
    expect(data.totalIncome).toBe(2000);
    expect(data.totalExpenses).toBe(800);
    expect(data.balance).toBe(1200);
  });

  test('recentTransactions capped at 8', async () => {
    const { token, cashId } = await setup();
    for (let i = 0; i < 10; i++) {
      await createTx(token, cashId, { amount: 10 + i, category: 'Food' });
    }
    const res = await request(app)
      .get('/api/v1/dashboard')
      .set(auth(token));
    expect(res.body.data.recentTransactions.length).toBeLessThanOrEqual(8);
  });

  test('dashboard requires auth → 401', async () => {
    const res = await request(app).get('/api/v1/dashboard');
    expect(res.status).toBe(401);
  });

  test('budget field has level, percentUsed, spent', async () => {
    const { token } = await setup();
    const res = await request(app)
      .get('/api/v1/dashboard')
      .set(auth(token));
    const { budget } = res.body.data;
    expect(budget).toHaveProperty('level');
    expect(budget).toHaveProperty('percentUsed');
    expect(budget).toHaveProperty('spent');
  });
});
