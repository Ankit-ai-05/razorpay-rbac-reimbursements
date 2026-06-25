'use strict';

process.env.NODE_ENV = 'test';
require('dotenv').config();

const request = require('supertest');
const app = require('../../app');
const { setupTestDb, teardownTestDb } = require('../helpers/testDb');

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  // ── Registration ────────────────────────────────────────────────────────────
  describe('POST /rest/onboardings/register', () => {
    it('should register a new employee successfully', async () => {
      const res = await request(app)
        .post('/rest/onboardings/register')
        .send({ name: 'Alice Smith', email: 'alice@org.com', password: 'securepass123' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe('alice@org.com');
      expect(res.body.data.user.role).toBe('EMP');
      expect(res.body.data.user.password_hash).toBeUndefined();
    });

    it('should reject non-org.com email', async () => {
      const res = await request(app)
        .post('/rest/onboardings/register')
        .send({ name: 'Bob', email: 'bob@gmail.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('should reject duplicate email registration', async () => {
      await request(app)
        .post('/rest/onboardings/register')
        .send({ name: 'Charlie', email: 'charlie@org.com', password: 'password123' });

      const res = await request(app)
        .post('/rest/onboardings/register')
        .send({ name: 'Charlie Again', email: 'charlie@org.com', password: 'password456' });

      expect(res.status).toBe(409);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/rest/onboardings/register')
        .send({ email: 'noname@org.com' }); // missing name and password

      expect(res.status).toBe(422);
      expect(res.body.status).toBe('error');
    });
  });

  // ── Login ───────────────────────────────────────────────────────────────────
  describe('POST /rest/onboardings/login', () => {
    beforeAll(async () => {
      await request(app)
        .post('/rest/onboardings/register')
        .send({ name: 'Dave', email: 'dave@org.com', password: 'mypassword123' });
    });

    it('should login successfully and set cookie', async () => {
      const res = await request(app)
        .post('/rest/onboardings/login')
        .send({ email: 'dave@org.com', password: 'mypassword123' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe('dave@org.com');

      // Check cookie is set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/token=/);
      expect(cookies[0]).toMatch(/HttpOnly/i);
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/rest/onboardings/login')
        .send({ email: 'dave@org.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/rest/onboardings/login')
        .send({ email: 'nobody@org.com', password: 'password' });

      expect(res.status).toBe(401);
    });
  });

  // ── Logout ──────────────────────────────────────────────────────────────────
  describe('POST /rest/onboardings/logout', () => {
    it('should logout and clear cookie', async () => {
      // First login
      const loginRes = await request(app)
        .post('/rest/onboardings/login')
        .send({ email: 'dave@org.com', password: 'mypassword123' });

      const cookie = loginRes.headers['set-cookie'][0];

      const logoutRes = await request(app)
        .post('/rest/onboardings/logout')
        .set('Cookie', cookie);

      expect(logoutRes.status).toBe(200);
    });

    it('should reject logout without auth cookie', async () => {
      const res = await request(app).post('/rest/onboardings/logout');
      expect(res.status).toBe(401);
    });
  });
});
