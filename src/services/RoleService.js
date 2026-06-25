'use strict';

const userRepository = require('../repositories/UserRepository');
const AppError = require('../utils/AppError');
const { ROLES } = require('../utils/constants');

const ASSIGNABLE_ROLES = [ROLES.EMP, ROLES.RM, ROLES.APE];

class RoleService {
  /**
   * Assign a role to a user.
   * Business rules:
   *  - CFO role cannot be reassigned through this endpoint
   *  - Target user must exist
   * @param {string} targetUserId
   * @param {string} role
   * @returns {Promise<User>}
   */
  async assignRole(targetUserId, role) {
    if (!ASSIGNABLE_ROLES.includes(role)) {
      throw new AppError(
        `Invalid role. Assignable roles are: ${ASSIGNABLE_ROLES.join(', ')}`,
        400
      );
    }

    const user = await userRepository.findById(targetUserId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === ROLES.CFO) {
      throw new AppError('CFO role cannot be modified', 403);
    }

    await userRepository.updateRole(targetUserId, role);
    return userRepository.findById(targetUserId);
  }
}

module.exports = new RoleService();
