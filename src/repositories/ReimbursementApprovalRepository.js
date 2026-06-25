'use strict';

const { ReimbursementApproval, User } = require('../models');

class ReimbursementApprovalRepository {
  /**
   * Create an approval record.
   * @param {object} data
   * @returns {Promise<ReimbursementApproval>}
   */
  async create(data) {
    return ReimbursementApproval.create(data);
  }

  /**
   * Find all approvals for a reimbursement, ordered chronologically.
   * @param {string} reimbursementId
   * @returns {Promise<ReimbursementApproval[]>}
   */
  async findByReimbursement(reimbursementId) {
    return ReimbursementApproval.findAll({
      where: { reimbursement_id: reimbursementId },
      include: [{ model: User, as: 'Approver', attributes: { exclude: ['password_hash'] } }],
      order: [['created_at', 'ASC']],
    });
  }

  /**
   * Find approval by reimbursement and approver role.
   * Prevents double-approving by the same role.
   * @param {string} reimbursementId
   * @param {string} approverRole
   * @returns {Promise<ReimbursementApproval|null>}
   */
  async findByReimbursementAndRole(reimbursementId, approverRole) {
    return ReimbursementApproval.findOne({
      where: { reimbursement_id: reimbursementId, approver_role: approverRole },
    });
  }

  /**
   * Check if RM approved a specific reimbursement.
   * @param {string} reimbursementId
   * @returns {Promise<boolean>}
   */
  async isRmApproved(reimbursementId) {
    const approval = await ReimbursementApproval.findOne({
      where: { reimbursement_id: reimbursementId, approver_role: 'RM', decision: 'APPROVED' },
    });
    return !!approval;
  }
}

module.exports = new ReimbursementApprovalRepository();
