'use strict';

const { User } = require('../models');

/**
 * UserRepository — all DB operations for User entity.
 * No business logic here; services own that.
 */
class UserRepository {
  /**
   * Create a new user record.
   * @param {object} userData
   * @returns {Promise<User>}
   */
  async create(userData) {
    return User.create(userData);
  }

  /**
   * Find a user by primary key.
   * @param {string} id UUID
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    return User.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
    });
  }

  /**
   * Find user with password_hash included (for auth only).
   * @param {string} email
   * @returns {Promise<User|null>}
   */
  async findByEmailWithPassword(email) {
    return User.findOne({ where: { email } });
  }

  /**
   * Find by email without password.
   * @param {string} email
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    return User.findOne({
      where: { email },
      attributes: { exclude: ['password_hash'] },
    });
  }

  /**
   * Get all users (CFO use-case).
   * @returns {Promise<User[]>}
   */
  async findAll() {
    return User.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'ASC']],
    });
  }

  /**
   * Update role for a user.
   * @param {string} userId
   * @param {string} role
   * @returns {Promise<[number]>}
   */
  async updateRole(userId, role) {
    return User.update({ role }, { where: { id: userId } });
  }
}

module.exports = new UserRepository();
