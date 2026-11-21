import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { addMonths, subDays } from 'date-fns';
import app from '../app.js';
import RecurringRule from '../models/RecurringRule.js';
import Transaction from '../models/Transaction.js';
import { processDueRecurring } from '../services/recurring.js';

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
  const cols = mongoose.connection.collections;
  for (const key in cols) await cols[key].deleteMany({});
});

// ── Helpers ────────────────────────────────────────────────────────────────
let _counter = 0;
async function setup() {
  const id = ++_counter;
  const email = `m7user${id}@test.com`;
  const reg = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'User', email, password: 'Password1' });
  const token = reg.body.data.token;
  const userId = reg.body.data.user._id;
  const accRes = await request(app)
    .get('/api/v1/accounts')
    .set('Authorization', `Bearer ${token}`);
  const cashId = accRes.body.data.accounts[0]._id;
  return { token, userId, cashId };
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

// ═══════════════════════════════════════════════════════════════════════════
// GOALS CRUD
// ═══════════════════════════════════════════════════════════════════════════
describe('Goals CRUD', () => {
  test('create goal returns goal with progress=0', async () => {
    const { token } = await setup();
    const res = await request(app)
      .post('/api/v1/goals')
      .set(auth(token))
      .send({ name: 'Emergency Fund', targetAmount: 5000, targetDate: '2026-12-31' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Emergency Fund');
    expect(res.body.data.targetAmount).toBe(5000);
    expect(res.body.data.currentAmount).toBe(0);
    expect(res.body.data.progress).toBe(0);
  });

  test('list goals returns all user goals with progress', async () => {
    const { token } = await setup();
    await request(app)
      .post('/api/v1/goals')
      .set(auth(token))
      .send({ name: 'Goal A', targetAmount: 1000, targetDate: '2026-12-31' });
    await request(app)
      .post('/api/v1/goals')
      .set(auth(token))
      .send({ name: 'Goal B', targetAmount: 2000, targetDate: '2026-12-31' });
    const res = await request(app).get('/api/v1/goals').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toHaveProperty('progress');
  });

  test('update goal changes name and targetAmount', async () => {
    const { token } = await setup();
    const create = await request(app)
      .post('/api/v1/goals')
      .set(auth(token))
      .send({ name: 'Old', targetAmount: 100, targetDate: '2026-12-31' });
    const id = create.body.data._id;
    const res = await request(app)
      .put(`/api/v1/goals/${id}`)
      .set(auth(token))
      .send({ name: 'New', targetAmount: 200 });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('New');
    expect(res.body.data.targetAmount).toBe(200);
  });

  test('delete goal returns 200 then 404 on get', async () => {
    const { token } = await setup();
    const create = await request(app)
      .post('/api/v1/goals')
      .set(auth(token))
      .send({ name: 'Delete me', targetAmount: 500, targetDate: '2026-12-31' });
    const id = create.body.data._id;
    const del = await request(app).delete(`/api/v1/goals/${id}`).set(auth(token));
    expect(del.status).toBe(200);
    // List should be empty
    const list = await request(app).get('/api/v1/goals').set(auth(token));
    expect(list.body.data).toHaveLength(0);
  });

  test('delete non-existent goal → 404', async () => {
    const { token } = await setup();
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).delete(`/api/v1/goals/${fakeId}`).set(auth(token));
    expect(res.status).toBe(404);
  });

  test('goals require auth → 401', async () => {
    const res = await request(app).get('/api/v1/goals');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GOAL CONTRIBUTION & PROGRESS
// ═══════════════════════════════════════════════════════════════════════════
describe('Goal contribution and progress', () => {
  test('contribute increases currentAmount and recalculates progress', async () => {
    const { token } = await setup();
    const create = await request(app)
      .post('/api/v1/goals')
      .set(auth(token))
      .send({ name: 'Vacation', targetAmount: 1000, targetDate: '2026-12-31' });
    const id = create.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/goals/${id}/contribute`)
      .set(auth(token))
      .send({ amount: 500 });
    expect(res.status).toBe(200);
    expect(res.body.data.currentAmount).toBe(500);
    expect(res.body.data.progress).toBe(50);
  });

  test('progress is capped at 100 even when over-funded', async () => {
    const { token } = await setup();
    const create = await request(app)
      .post('/api/v1/goals')
      .set(auth(token))
      .send({ name: 'Car', targetAmount: 100, targetDate: '2026-12-31' });
    const id = create.body.data._id;

    await request(app)
      .patch(`/api/v1/goals/${id}/contribute`)
      .set(auth(token))
      .send({ amount: 150 });

    const list = await request(app).get('/api/v1/goals').set(auth(token));
    expect(list.body.data[0].progress).toBe(100);
  });

  test('User B cannot contribute to User A goal → 404', async () => {
    const { token: tokenA } = await setup();
    const { token: tokenB } = await setup();
    const create = await request(app)
      .post('/api/v1/goals')
      .set(auth(tokenA))
      .send({ name: 'A Goal', targetAmount: 1000, targetDate: '2026-12-31' });
    const id = create.body.data._id;
    const res = await request(app)
      .patch(`/api/v1/goals/${id}/contribute`)
      .set(auth(tokenB))
      .send({ amount: 100 });
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RECURRING RULE CREATION VIA TRANSACTION
// ═══════════════════════════════════════════════════════════════════════════
describe('Recurring rule creation via transaction', () => {
  test('creating a transaction with recurring.enabled creates a RecurringRule', async () => {
    const { token, userId, cashId } = await setup();
    const txDate = new Date().toISOString();
    const res = await request(app)
      .post('/api/v1/transactions')
      .set(auth(token))
      .send({
        account: cashId,
        type: 'expense',
        amount: 100,
        category: 'Bills',
        note: 'Monthly bill',
        date: txDate,
        recurring: { enabled: true, frequency: 'monthly' },
      });
    expect(res.status).toBe(201);

    // Check a RecurringRule was created for this user
    const userObjId = new mongoose.Types.ObjectId(userId);
    const rule = await RecurringRule.findOne({ user: userObjId });
    expect(rule).not.toBeNull();
    expect(rule.frequency).toBe('monthly');
    expect(rule.active).toBe(true);
    // nextDate should be ~1 month after the transaction date
    const expectedNext = addMonths(new Date(txDate), 1);
    expect(Math.abs(rule.nextDate - expectedNext)).toBeLessThan(5000); // within 5s
  });

  test('recurring.enabled=false does not create a RecurringRule', async () => {
    const { token, userId, cashId } = await setup();
    await request(app)
      .post('/api/v1/transactions')
      .set(auth(token))
      .send({
        account: cashId,
        type: 'expense',
        amount: 50,
        category: 'Food',
        date: new Date().toISOString(),
        recurring: { enabled: false },
      });
    const userObjId = new mongoose.Types.ObjectId(userId);
    const count = await RecurringRule.countDocuments({ user: userObjId });
    expect(count).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RECURRING PROCESSOR
// ═══════════════════════════════════════════════════════════════════════════
describe('processDueRecurring', () => {
  test('concurrent catch-up creates exactly one transaction per occurrence and retries safely', async () => {
    const { userId, cashId } = await setup();
    const nextDate = new Date();
    nextDate.setUTCHours(0, 0, 0, 0);
    nextDate.setUTCDate(nextDate.getUTCDate() - 3);
    const rule = await RecurringRule.create({ user: userId, account: cashId, type: 'expense', amount: 10, category: 'Food', frequency: 'daily', nextDate });
    await Transaction.init();
    await Promise.all([processDueRecurring(userId), processDueRecurring(userId), processDueRecurring(userId)]);
    await processDueRecurring(userId);
    expect(await Transaction.countDocuments({ user: userId, recurringRule: rule._id })).toBe(4);
    expect(await RecurringRule.countDocuments({ user: userId })).toBe(1);
  });
  test('processes a daily rule and creates catch-up transactions', async () => {
    const { userId, cashId } = await setup();
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Create rule with nextDate 3 days ago (simulate 3 missed days)
    const missedDate = subDays(new Date(), 3);
    await RecurringRule.create({
      user: userObjId,
      account: new mongoose.Types.ObjectId(cashId),
      type: 'expense',
      amount: 10,
      category: 'Food',
      note: '',
      frequency: 'daily',
      nextDate: missedDate,
      active: true,
    });

    await processDueRecurring(userId);

    // Should have created 3 or more catch-up transactions
    const txCount = await Transaction.countDocuments({ user: userObjId });
    expect(txCount).toBeGreaterThanOrEqual(3);
  });

  test('advances nextDate past endDate and deactivates the rule', async () => {
    const { userId, cashId } = await setup();
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Rule that ended yesterday (nextDate = 2 days ago, endDate = yesterday)
    const twoDaysAgo = subDays(new Date(), 2);
    const yesterday = subDays(new Date(), 1);
    await RecurringRule.create({
      user: userObjId,
      account: new mongoose.Types.ObjectId(cashId),
      type: 'expense',
      amount: 20,
      category: 'Bills',
      note: '',
      frequency: 'daily',
      nextDate: twoDaysAgo,
      endDate: yesterday,
      active: true,
    });

    await processDueRecurring(userId);

    const rule = await RecurringRule.findOne({ user: userObjId });
    expect(rule.active).toBe(false);
  });

  test('generated catch-up transactions do NOT spawn new RecurringRules', async () => {
    const { userId, cashId } = await setup();
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Single rule, 2 days overdue
    await RecurringRule.create({
      user: userObjId,
      account: new mongoose.Types.ObjectId(cashId),
      type: 'expense',
      amount: 15,
      category: 'Health',
      note: '',
      frequency: 'daily',
      nextDate: subDays(new Date(), 2),
      active: true,
    });

    await processDueRecurring(userId);

    // Should still be exactly 1 rule
    const ruleCount = await RecurringRule.countDocuments({ user: userObjId });
    expect(ruleCount).toBe(1);
  });

  test('no-op when no rules are due', async () => {
    const { userId, cashId } = await setup();
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Rule with nextDate in the future
    await RecurringRule.create({
      user: userObjId,
      account: new mongoose.Types.ObjectId(cashId),
      type: 'expense',
      amount: 50,
      category: 'Bills',
      note: '',
      frequency: 'monthly',
      nextDate: addMonths(new Date(), 1),
      active: true,
    });

    await processDueRecurring(userId);

    const txCount = await Transaction.countDocuments({ user: userObjId });
    expect(txCount).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RECURRING RULES ROUTES
// ═══════════════════════════════════════════════════════════════════════════
describe('Recurring rules API', () => {
  test('GET /recurring lists all rules for user', async () => {
    const { token, userId, cashId } = await setup();
    const userObjId = new mongoose.Types.ObjectId(userId);
    await RecurringRule.create({
      user: userObjId,
      account: new mongoose.Types.ObjectId(cashId),
      type: 'expense',
      amount: 100,
      category: 'Bills',
      note: '',
      frequency: 'monthly',
      nextDate: addMonths(new Date(), 1),
      active: true,
    });

    const res = await request(app).get('/api/v1/recurring').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].frequency).toBe('monthly');
  });

  test('PATCH /recurring/:id can pause (active=false) a rule', async () => {
    const { token, userId, cashId } = await setup();
    const userObjId = new mongoose.Types.ObjectId(userId);
    const rule = await RecurringRule.create({
      user: userObjId,
      account: new mongoose.Types.ObjectId(cashId),
      type: 'expense',
      amount: 100,
      category: 'Bills',
      note: '',
      frequency: 'monthly',
      nextDate: addMonths(new Date(), 1),
      active: true,
    });

    const res = await request(app)
      .patch(`/api/v1/recurring/${rule._id}`)
      .set(auth(token))
      .send({ active: false });
    expect(res.status).toBe(200);
    expect(res.body.data.active).toBe(false);
  });

  test('DELETE /recurring/:id removes the rule', async () => {
    const { token, userId, cashId } = await setup();
    const userObjId = new mongoose.Types.ObjectId(userId);
    const rule = await RecurringRule.create({
      user: userObjId,
      account: new mongoose.Types.ObjectId(cashId),
      type: 'expense',
      amount: 100,
      category: 'Bills',
      note: '',
      frequency: 'monthly',
      nextDate: addMonths(new Date(), 1),
      active: true,
    });

    await request(app).delete(`/api/v1/recurring/${rule._id}`).set(auth(token));
    const list = await request(app).get('/api/v1/recurring').set(auth(token));
    expect(list.body.data).toHaveLength(0);
  });

  test('User B cannot PATCH User A rule → 404', async () => {
    const { userId: userAId, cashId: cashAId } = await setup();
    const { token: tokenB } = await setup();
    const userAObjId = new mongoose.Types.ObjectId(userAId);
    const rule = await RecurringRule.create({
      user: userAObjId,
      account: new mongoose.Types.ObjectId(cashAId),
      type: 'expense',
      amount: 100,
      category: 'Bills',
      note: '',
      frequency: 'monthly',
      nextDate: addMonths(new Date(), 1),
      active: true,
    });

    const res = await request(app)
      .patch(`/api/v1/recurring/${rule._id}`)
      .set(auth(tokenB))
      .send({ active: false });
    expect(res.status).toBe(404);
  });

  test('recurring routes require auth → 401', async () => {
    const res = await request(app).get('/api/v1/recurring');
    expect(res.status).toBe(401);
  });
});
