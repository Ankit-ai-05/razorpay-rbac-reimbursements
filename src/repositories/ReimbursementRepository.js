'use strict';

const { Op } = require('sequelize');
const { Reimbursement, User, ReimbursementApproval } = require('../models');
const { REIMBURSEMENT_STATUS, ROLES, DECISION } = require('../utils/constants');

class ReimbursementRepository {
  /**
   * Create a new reimbursement.
   * @param {object} data
   * @returns {Promise<Reimbursement>}
   */
  async create(data) {
    return Reimbursement.create(data);
  }

  /**
   * Find by primary key with employee and approvals.
   * @param {string} id
   * @returns {Promise<Reimbursement|null>}
   */
  async findById(id) {
    return Reimbursement.findByPk(id, {
      include: [
        { model: User, as: 'Employee', attributes: { exclude: ['password_hash'] } },
        {
          model: ReimbursementApproval,
          as: 'Approvals',
          include: [{ model: User, as: 'Approver', attributes: { exclude: ['password_hash'] } }],
        },
      ],
    });
  }

  /**
   * Get reimbursements for a specific employee.
   * @param {string} employeeId
   * @returns {Promise<Reimbursement[]>}
   */
  async findByEmployee(employeeId) {
    return Reimbursement.findAll({
      where: { employee_id: employeeId },
      include: [
        {
          model: ReimbursementApproval,
          as: 'Approvals',
          include: [{ model: User, as: 'Approver', attributes: { exclude: ['password_hash'] } }],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Get pending reimbursements for employees managed by a given RM.
   * @param {string[]} employeeIds
   * @returns {Promise<Reimbursement[]>}
   */
  async findPendingForEmployees(employeeIds) {
    return Reimbursement.findAll({
      where: {
        employee_id: { [Op.in]: employeeIds },
        final_status: REIMBURSEMENT_STATUS.PENDING,
      },
      include: [
        { model: User, as: 'Employee', attributes: { exclude: ['password_hash'] } },
        { model: ReimbursementApproval, as: 'Approvals' },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Get reimbursements approved by RM but not yet processed by APE.
   * These are reimbursements that have an RM APPROVED record but NO APE record.
   * @returns {Promise<Reimbursement[]>}
   */
  async findRmApprovedPendingApe() {
    const { sequelize } = require('../models');

    return Reimbursement.findAll({
      where: {
        final_status: REIMBURSEMENT_STATUS.PENDING,
      },
      include: [
        { model: User, as: 'Employee', attributes: { exclude: ['password_hash'] } },
        {
          model: ReimbursementApproval,
          as: 'Approvals',
        },
      ],
      having: sequelize.literal(`
        COUNT(CASE WHEN "Approvals"."approver_role" = 'RM' AND "Approvals"."decision" = 'APPROVED' THEN 1 END) > 0
        AND
        COUNT(CASE WHEN "Approvals"."approver_role" = 'APE' THEN 1 END) = 0
      `),
      group: ['"Reimbursement"."id"', '"Employee"."id"'],
      subQuery: false,
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Get reimbursements approved by APE (visible to CFO).
   * @returns {Promise<Reimbursement[]>}
   */
  async findApeApproved() {
    const subQuery = `
      SELECT DISTINCT ra.reimbursement_id
      FROM reimbursement_approvals ra
      WHERE ra.approver_role = 'APE' AND ra.decision = 'APPROVED'
    `;

    const { sequelize } = require('../models');

    return Reimbursement.findAll({
      where: {
        id: { [Op.in]: sequelize.literal(`(${subQuery})`) },
      },
      include: [
        { model: User, as: 'Employee', attributes: { exclude: ['password_hash'] } },
        {
          model: ReimbursementApproval,
          as: 'Approvals',
          include: [{ model: User, as: 'Approver', attributes: { exclude: ['password_hash'] } }],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Update the final_status of a reimbursement.
   * @param {string} id
   * @param {string} status
   * @returns {Promise<[number]>}
   */
  async updateStatus(id, status) {
    return Reimbursement.update({ final_status: status }, { where: { id } });
  }
}

module.exports = new ReimbursementRepository();
