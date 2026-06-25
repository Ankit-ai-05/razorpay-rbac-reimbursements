'use strict';

const reimbursementRepository = require('../repositories/ReimbursementRepository');
const reimbursementApprovalRepository = require('../repositories/ReimbursementApprovalRepository');
const employeeManagerRepository = require('../repositories/EmployeeManagerRepository');
const AppError = require('../utils/AppError');
const { ROLES, REIMBURSEMENT_STATUS, DECISION } = require('../utils/constants');

class ReimbursementService {
  /**
   * Create a new reimbursement (EMP only).
   * @param {string} employeeId
   * @param {object} payload { title, description, amount }
   * @returns {Promise<Reimbursement>}
   */
  async createReimbursement(employeeId, { title, description, amount }) {
    return reimbursementRepository.create({
      employee_id: employeeId,
      title,
      description,
      amount,
      final_status: REIMBURSEMENT_STATUS.PENDING,
    });
  }

  /**
   * Get reimbursements based on the viewer's role.
   * @param {object} user The authenticated user { id, role }
   * @returns {Promise<Reimbursement[]>}
   */
  async getReimbursements(user) {
    switch (user.role) {
      case ROLES.EMP:
        return reimbursementRepository.findByEmployee(user.id);

      case ROLES.RM: {
        const employeeIds = await this._getEmployeeIds(user.id);
        return reimbursementRepository.findPendingForEmployees(employeeIds);
      }

      case ROLES.APE:
        return this._getApeView();

      case ROLES.CFO:
        return reimbursementRepository.findApeApproved();

      default:
        throw new AppError('Unknown role', 403);
    }
  }

  /**
   * Get reimbursements for a specific user — CFO or RM can use this.
   * @param {object} viewer The authenticated user
   * @param {string} targetUserId
   * @returns {Promise<Reimbursement[]>}
   */
  async getReimbursementsForUser(viewer, targetUserId) {
    if (viewer.role === ROLES.CFO) {
      return reimbursementRepository.findByEmployee(targetUserId);
    }

    if (viewer.role === ROLES.RM) {
      const employeeIds = await this._getEmployeeIds(viewer.id);
      if (!employeeIds.includes(targetUserId)) {
        throw new AppError('You are not authorized to view this employee\'s reimbursements', 403);
      }
      return reimbursementRepository.findByEmployee(targetUserId);
    }

    throw new AppError('Access denied', 403);
  }

  /**
   * Approve or Reject a reimbursement.
   * Business rules:
   *  - RM can only act on PENDING reimbursements from their employees
   *  - APE can only act on RM-approved reimbursements
   *  - No duplicate decisions from the same role
   *  - Final status computed from both RM+APE decisions
   * @param {object} approver The authenticated user
   * @param {string} reimbursementId
   * @param {string} decision APPROVED | REJECTED
   * @param {string} remarks optional
   */
  async processApproval(approver, reimbursementId, decision, remarks) {
    const reimbursement = await reimbursementRepository.findById(reimbursementId);
    if (!reimbursement) {
      throw new AppError('Reimbursement not found', 404);
    }

    // Once rejected or fully approved, no further action
    if (reimbursement.final_status === REIMBURSEMENT_STATUS.REJECTED) {
      throw new AppError('This reimbursement has already been rejected', 400);
    }
    if (reimbursement.final_status === REIMBURSEMENT_STATUS.APPROVED) {
      throw new AppError('This reimbursement has already been approved', 400);
    }

    // Check for duplicate role decision
    const existingDecision = await reimbursementApprovalRepository.findByReimbursementAndRole(
      reimbursementId,
      approver.role
    );
    if (existingDecision) {
      throw new AppError(`${approver.role} has already processed this reimbursement`, 409);
    }

    if (approver.role === ROLES.RM) {
      await this._validateRmApproval(approver.id, reimbursement);
    }

    if (approver.role === ROLES.APE) {
      await this._validateApeApproval(reimbursementId);
    }

    // Record the approval
    await reimbursementApprovalRepository.create({
      reimbursement_id: reimbursementId,
      approver_id: approver.id,
      approver_role: approver.role,
      decision,
      remarks: remarks || null,
    });

    // Compute and update final status
    await this._computeFinalStatus(reimbursementId, approver.role, decision);

    return reimbursementRepository.findById(reimbursementId);
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  async _getEmployeeIds(managerId) {
    const employees = await employeeManagerRepository.findEmployeesByManager(managerId);
    return employees.map((e) => e.id);
  }

  async _getApeView() {
    // Reimbursements with RM approved but not yet processed by APE
    const all = await reimbursementRepository.findRmApprovedPendingApe();
    return all;
  }

  async _validateRmApproval(rmId, reimbursement) {
    const employeeIds = await this._getEmployeeIds(rmId);
    if (!employeeIds.includes(reimbursement.employee_id)) {
      throw new AppError('This employee is not assigned to you', 403);
    }
  }

  async _validateApeApproval(reimbursementId) {
    const rmApproved = await reimbursementApprovalRepository.isRmApproved(reimbursementId);
    if (!rmApproved) {
      throw new AppError('Reimbursement must be approved by RM before APE can act', 400);
    }
  }

  async _computeFinalStatus(reimbursementId, approverRole, decision) {
    // Any rejection immediately closes the claim
    if (decision === DECISION.REJECTED) {
      await reimbursementRepository.updateStatus(reimbursementId, REIMBURSEMENT_STATUS.REJECTED);
      return;
    }

    // If APE approved, check if RM also approved → APPROVED
    if (approverRole === ROLES.APE && decision === DECISION.APPROVED) {
      const rmApproved = await reimbursementApprovalRepository.isRmApproved(reimbursementId);
      if (rmApproved) {
        await reimbursementRepository.updateStatus(reimbursementId, REIMBURSEMENT_STATUS.APPROVED);
        return;
      }
    }

    // Otherwise stays PENDING
  }
}

module.exports = new ReimbursementService();
