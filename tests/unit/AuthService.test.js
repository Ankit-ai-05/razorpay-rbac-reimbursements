'use strict';

process.env.NODE_ENV = 'test';
require('dotenv').config();

// Mock repositories to isolate service logic from DB
jest.mock('../../src/repositories/UserRepository');
jest.mock('../../src/repositories/EmployeeManagerRepository');
jest.mock('../../src/repositories/ReimbursementRepository');
jest.mock('../../src/repositories/ReimbursementApprovalRepository');

const userRepository = require('../../src/repositories/UserRepository');
const authService = require('../../src/services/AuthService');
const AppError = require('../../src/utils/AppError');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── register ────────────────────────────────────────────────────────────────
  describe('register', () => {
    it('should reject non-org.com email domains', async () => {
      await expect(
        authService.register({ name: 'Test User', email: 'user@gmail.com', password: 'password123' })
      ).rejects.toThrow(AppError);

      await expect(
        authService.register({ name: 'Test User', email: 'user@gmail.com', password: 'password123' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should reject duplicate emails', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 'existing-id' });
      userRepository.findByEmailWithPassword = jest.fn();

      await expect(
        authService.register({ name: 'Test', email: 'test@org.com', password: 'password123' })
      ).rejects.toThrow(AppError);

      await expect(
        authService.register({ name: 'Test', email: 'test@org.com', password: 'password123' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('should create user with EMP role for valid org.com email', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({
        toJSON: () => ({
          id: 'new-uuid',
          name: 'John Doe',
          email: 'john@org.com',
          role: 'EMP',
          password_hash: 'hashed',
          created_at: new Date(),
        }),
      });

      const result = await authService.register({
        name: 'John Doe',
        email: 'john@org.com',
        password: 'securepass',
      });

      expect(result.role).toBe('EMP');
      expect(result.password_hash).toBeUndefined(); // must not be returned
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'EMP', email: 'john@org.com' })
      );
    });
  });

  // ── login ───────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('should throw 401 for non-existent user', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        authService.login('nobody@org.com', 'password')
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 401 for wrong password', async () => {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('correctpassword', 10);
      userRepository.findByEmailWithPassword.mockResolvedValue({
        id: 'uid',
        email: 'user@org.com',
        role: 'EMP',
        password_hash: hash,
        toJSON: () => ({ id: 'uid', email: 'user@org.com', role: 'EMP', password_hash: hash }),
      });

      await expect(
        authService.login('user@org.com', 'wrongpassword')
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should return token and safe user for correct credentials', async () => {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('correctpassword', 10);
      userRepository.findByEmailWithPassword.mockResolvedValue({
        id: 'uid',
        email: 'user@org.com',
        role: 'EMP',
        password_hash: hash,
        toJSON: () => ({ id: 'uid', email: 'user@org.com', role: 'EMP', password_hash: hash }),
      });

      const result = await authService.login('user@org.com', 'correctpassword');

      expect(result.token).toBeDefined();
      expect(result.user.password_hash).toBeUndefined();
      expect(result.user.email).toBe('user@org.com');
    });
  });
});
