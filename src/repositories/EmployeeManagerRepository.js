'use strict';

const { EmployeeManager, User } = require('../models');

class EmployeeManagerRepository {
  /**
   * Assign an employee to a manager.
   * @param {string} employeeId
   * @param {string} managerId
   * @returns {Promise<EmployeeManager>}
   */
  async assign(employeeId, managerId) {
    return EmployeeManager.create({ employee_id: employeeId, manager_id: managerId });
  }

  /**
   * Remove the assignment.
   * @param {string} employeeId
   * @param {string} managerId
   * @returns {Promise<number>} rows deleted
   */
  async remove(employeeId, managerId) {
    return EmployeeManager.destroy({
      where: { employee_id: employeeId, manager_id: managerId },
    });
  }

  /**
   * Check if assignment already exists.
   * @param {string} employeeId
   * @param {string} managerId
   * @returns {Promise<EmployeeManager|null>}
   */
  async findAssignment(employeeId, managerId) {
    return EmployeeManager.findOne({
      where: { employee_id: employeeId, manager_id: managerId },
    });
  }

  /**
   * Get all employees for a given manager.
   * @param {string} managerId
   * @returns {Promise<User[]>}
   */
  async findEmployeesByManager(managerId) {
    const records = await EmployeeManager.findAll({
      where: { manager_id: managerId },
      include: [
        {
          model: User,
          as: 'Employee',
          attributes: { exclude: ['password_hash'] },
        },
      ],
    });
    return records.map((r) => r.Employee);
  }

  /**
   * Get manager IDs for a given employee.
   * @param {string} employeeId
   * @returns {Promise<string[]>}
   */
  async findManagerIdsByEmployee(employeeId) {
    const records = await EmployeeManager.findAll({
      where: { employee_id: employeeId },
      attributes: ['manager_id'],
    });
    return records.map((r) => r.manager_id);
  }
}

module.exports = new EmployeeManagerRepository();
