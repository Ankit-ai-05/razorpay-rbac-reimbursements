'use strict';

const roleService = require('../../services/RoleService');
const userService = require('../../services/UserService');
const { sendSuccess } = require('../../utils/response');

class RolesController {
  /**
   * POST /rest/roles/assign
   * CFO only.
   */
  async assignRole(req, res, next) {
    try {
      const { userId, role } = req.body;
      const updatedUser = await roleService.assignRole(userId, role);
      return sendSuccess(res, { user: updatedUser });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RolesController();
