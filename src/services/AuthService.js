'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/UserRepository');
const AppError = require('../utils/AppError');
const jwtConfig = require('../config/jwt');
const { ROLES, ALLOWED_EMAIL_DOMAIN } = require('../utils/constants');

const SALT_ROUNDS = 12;

class AuthService {
  /**
   * Register a new user.
   * Business rules:
   *  - Email must be @org.com
   *  - Email must not already exist
   *  - Default role = EMP
   * @param {object} payload { name, email, password }
   * @returns {Promise<User>}
   */
  async register({ name, email, password }) {
    // Rule: only org.com emails allowed
    const domain = email.split('@')[1];
    if (domain !== ALLOWED_EMAIL_DOMAIN) {
      throw new AppError(`Only @${ALLOWED_EMAIL_DOMAIN} emails are permitted`, 400);
    }

    // Rule: no duplicate emails
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new AppError('An account with this email already exists', 409);
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await userRepository.create({
      name,
      email,
      password_hash,
      role: ROLES.EMP, // default
    });

    // Never return password hash
    const { password_hash: _, ...safeUser } = user.toJSON();
    return safeUser;
  }

  /**
   * Login and return a signed JWT.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{token: string, user: object}>}
   */
  async login(email, password) {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      // Intentionally vague to prevent user enumeration
      throw new AppError('Invalid email or password', 401);
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });

    const { password_hash: _, ...safeUser } = user.toJSON();
    return { token, user: safeUser };
  }

  /**
   * Verify a JWT and return decoded payload.
   * @param {string} token
   * @returns {object} decoded JWT payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, jwtConfig.secret);
    } catch (err) {
      throw new AppError('Invalid or expired token', 401);
    }
  }
}

module.exports = new AuthService();
