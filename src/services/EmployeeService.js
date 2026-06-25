'use strict';

const userRepository = require('../repositories/UserRepository');
const employeeManagerRepository = require('../repositories/EmployeeManagerRepository');
const AppError = require('../utils/AppError');
const { ROLES } = require('../utils/constants');

class EmployeeService {
  /**
   * Get all employees assigned to a manager.
   * @param {string} managerId
   * @returns {Promise<User[]>}
   */
  async getEmployeesForManager(managerId) {
    return employeeManagerRepository.findEmployeesByManager(managerId);
  }

  /**
   * Assign an employee to a manager (CFO action).
   * Business rules:
   *  - Employee must have role EMP
   *  - Manager must have role RM
   *  - No duplicate assignment
   *  - Employee cannot be their own manager
   * @param {string} employeeId
   * @param {string} managerId
   */
  async assignEmployeeToManager(employeeId, managerId) {
    if (employeeId === managerId) {
      throw new AppError('An employee cannot be assigned to themselves as manager', 400);
    }

    const [employee, manager] = await Promise.all([
      userRepository.findById(employeeId),
      userRepository.findById(managerId),
    ]);

    if (!employee) throw new AppError('Employee not found', 404);
    if (!manager) throw new AppError('Manager not found', 404);

    if (employee.role !== ROLES.EMP) {
      throw new AppError('Target user must have the EMP role', 400);
    }
    if (manager.role !== ROLES.RM) {
      throw new AppError('Target manager must have the RM role', 400);
    }

    const existing = await employeeManagerRepository.findAssignment(employeeId, managerId);
    if (existing) {
      throw new AppError('This employee is already assigned to this manager', 409);
    }

    return employeeManagerRepository.assign(employeeId, managerId);
  }

  /**
   * Remove an employee-manager assignment (CFO action).
   * @param {string} employeeId
   * @param {string} managerId
   */
  async removeAssignment(employeeId, managerId) {
    const existing = await employeeManagerRepository.findAssignment(employeeId, managerId);
    if (!existing) {
      throw new AppError('Assignment not found', 404);
    }

    const rows = await employeeManagerRepository.remove(employeeId, managerId);
    if (rows === 0) {
      throw new AppError('Failed to remove assignment', 500);
    }
    return { message: 'Assignment removed successfully' };
  }
}

module.exports = new EmployeeService();
