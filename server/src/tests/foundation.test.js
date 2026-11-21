import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('GET /api/v1/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.service).toBe('spendly-api');
    expect(res.body.data.timestamp).toBeDefined();
  });
});

describe('Unknown route', () => {
  it('returns 404 with standard error shape', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(typeof res.body.error.message).toBe('string');
  });

  it('returns 404 for a totally unknown base path', async () => {
    const res = await request(app).post('/totally/unknown');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('CORS', () => {
  it('rejects requests from a disallowed origin with a CORS error', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://evil.example.com');
    // Express CORS middleware will either refuse (network-level) or return a 500
    // that propagates as a non-2xx / missing Access-Control-Allow-Origin header.
    // Supertest receives the response either way; we assert the header is absent.
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows requests from the allowed CLIENT_ORIGIN', async () => {
    // In test, CLIENT_ORIGIN defaults to http://localhost:5173 in .env.test or
    // falls through the "no origin" path (server-to-server). We simulate a
    // same-origin browser call.
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
