'use strict';

const employeeService = require('../../services/EmployeeService');
const userService = require('../../services/UserService');
const { sendSuccess } = require('../../utils/response');
const { ROLES } = require('../../utils/constants');

class EmployeesController {
  /**
   * GET /rest/employees
   * CFO: all users | RM: their assigned employees
   */
  async getEmployees(req, res, next) {
    try {
      let data;
      if (req.user.role === ROLES.CFO) {
        data = await userService.getAllUsers();
      } else {
        // RM
        data = await employeeService.getEmployeesForManager(req.user.id);
      }
      return sendSuccess(res, { employees: data });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /rest/employees/assign
   * CFO only.
   */
  async assignEmployee(req, res, next) {
    try {
      const { employeeId, managerId } = req.body;
      const assignment = await employeeService.assignEmployeeToManager(employeeId, managerId);
      return sendSuccess(res, { assignment }, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /rest/employees/assign
   * CFO only.
   */
  async removeAssignment(req, res, next) {
    try {
      const { employeeId, managerId } = req.body;
      const result = await employeeService.removeAssignment(employeeId, managerId);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EmployeesController();
