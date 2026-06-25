'use strict';

process.env.NODE_ENV = 'test';
require('dotenv').config();

const request = require('supertest');
const app = require('../../app');
const { setupTestDb, teardownTestDb } = require('../helpers/testDb');
const bcrypt = require('bcrypt');
const { User, EmployeeManager } = require('../../src/models');

// ── Test Fixtures ────────────────────────────────────────────────────────────
let empCookie, rmCookie, apeCookie;
let employeeId, managerId, apeId;
let reimbursementId;

const createUser = async (name, email, role) => {
  const hash = await bcrypt.hash('password123', 10);
  return User.create({ name, email, password_hash: hash, role });
};

const loginAs = async (email) => {
  const res = await request(app)
    .post('/rest/onboardings/login')
    .send({ email, password: 'password123' });
  return res.headers['set-cookie'][0];
};

describe('Reimbursements Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDb();

    // Create test users
    const emp = await createUser('Employee One', 'emp1@org.com', 'EMP');
    const rm = await createUser('Manager One', 'rm1@org.com', 'RM');
    const ape = await createUser('APE One', 'ape1@org.com', 'APE');

    employeeId = emp.id;
    managerId = rm.id;
    apeId = ape.id;

    // Assign employee to manager
    await EmployeeManager.create({ employee_id: employeeId, manager_id: managerId });

    // Get auth cookies
    empCookie = await loginAs('emp1@org.com');
    rmCookie = await loginAs('rm1@org.com');
    apeCookie = await loginAs('ape1@org.com');
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  // ── Create Reimbursement ─────────────────────────────────────────────────
  describe('POST /rest/reimbursements', () => {
    it('should allow EMP to create a reimbursement', async () => {
      const res = await request(app)
        .post('/rest/reimbursements')
        .set('Cookie', empCookie)
        .send({ title: 'Travel to Delhi', amount: 1500.50, description: 'Business trip' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.reimbursement.final_status).toBe('PENDING');

      reimbursementId = res.body.data.reimbursement.id;
    });

    it('should not allow RM to create a reimbursement', async () => {
      const res = await request(app)
        .post('/rest/reimbursements')
        .set('Cookie', rmCookie)
        .send({ title: 'Test', amount: 100 });

      expect(res.status).toBe(403);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/rest/reimbursements')
        .set('Cookie', empCookie)
        .send({ title: 'No amount' });

      expect(res.status).toBe(422);
    });
  });

  // ── RM views pending reimbursements ──────────────────────────────────────
  describe('GET /rest/reimbursements (RM view)', () => {
    it('should return pending reimbursements for RM\'s employees', async () => {
      const res = await request(app)
        .get('/rest/reimbursements')
        .set('Cookie', rmCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.reimbursements)).toBe(true);
      expect(res.body.data.reimbursements.length).toBeGreaterThan(0);
    });
  });

  // ── RM approves reimbursement ────────────────────────────────────────────
  describe('PATCH /rest/reimbursements (RM approval)', () => {
    it('should allow RM to approve a reimbursement from their employee', async () => {
      const res = await request(app)
        .patch('/rest/reimbursements')
        .set('Cookie', rmCookie)
        .send({ reimbursementId, decision: 'APPROVED', remarks: 'Looks good' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });

    it('should not allow RM to approve again (duplicate)', async () => {
      const res = await request(app)
        .patch('/rest/reimbursements')
        .set('Cookie', rmCookie)
        .send({ reimbursementId, decision: 'APPROVED' });

      expect(res.status).toBe(409);
    });
  });

  // ── APE views RM-approved reimbursements ──────────────────────────────────
  describe('GET /rest/reimbursements (APE view)', () => {
    it('should return RM-approved reimbursements for APE', async () => {
      const res = await request(app)
        .get('/rest/reimbursements')
        .set('Cookie', apeCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.reimbursements)).toBe(true);
    });
  });

  // ── APE approves ─────────────────────────────────────────────────────────
  describe('PATCH /rest/reimbursements (APE approval)', () => {
    it('should allow APE to approve and trigger APPROVED final status', async () => {
      const res = await request(app)
        .patch('/rest/reimbursements')
        .set('Cookie', apeCookie)
        .send({ reimbursementId, decision: 'APPROVED', remarks: 'Finance approved' });

      expect(res.status).toBe(200);
      expect(res.body.data.reimbursement.final_status).toBe('APPROVED');
    });
  });

  // ── EMP views their reimbursements ────────────────────────────────────────
  describe('GET /rest/reimbursements (EMP view)', () => {
    it('should return only employee\'s own reimbursements', async () => {
      const res = await request(app)
        .get('/rest/reimbursements')
        .set('Cookie', empCookie);

      expect(res.status).toBe(200);
      const reimbursements = res.body.data.reimbursements;
      expect(reimbursements.every((r) => r.employee_id === employeeId)).toBe(true);
    });
  });

  // ── Unauthenticated ───────────────────────────────────────────────────────
  describe('Authentication enforcement', () => {
    it('should reject requests without auth cookie', async () => {
      const res = await request(app).get('/rest/reimbursements');
      expect(res.status).toBe(401);
    });
  });
});
