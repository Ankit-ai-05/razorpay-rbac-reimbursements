'use strict';

const userRepository = require('../repositories/UserRepository');
const AppError = require('../utils/AppError');

class UserService {
  /**
   * Get all users — CFO only.
   * @returns {Promise<User[]>}
   */
  async getAllUsers() {
    return userRepository.findAll();
  }

  /**
   * Get a user by ID.
   * @param {string} userId
   * @returns {Promise<User>}
   */
  async getUserById(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }
}

module.exports = new UserService();
