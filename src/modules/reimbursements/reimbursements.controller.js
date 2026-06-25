'use strict';

const reimbursementService = require('../../services/ReimbursementService');
const { sendSuccess } = require('../../utils/response');
const { ROLES } = require('../../utils/constants');

class ReimbursementsController {
  /**
   * POST /rest/reimbursements
   * EMP only — create new reimbursement.
   */
  async createReimbursement(req, res, next) {
    try {
      const reimbursement = await reimbursementService.createReimbursement(
        req.user.id,
        req.body
      );
      return sendSuccess(res, { reimbursement }, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /rest/reimbursements
   * RM and APE — approve or reject.
   */
  async processApproval(req, res, next) {
    try {
      const { reimbursementId, decision, remarks } = req.body;
      const updated = await reimbursementService.processApproval(
        req.user,
        reimbursementId,
        decision,
        remarks
      );
      return sendSuccess(res, { reimbursement: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /rest/reimbursements
   * Role-aware listing:
   *  - EMP: own reimbursements
   *  - RM: pending from assigned employees
   *  - APE: RM-approved, unprocessed
   *  - CFO: APE-approved
   */
  async getReimbursements(req, res, next) {
    try {
      const reimbursements = await reimbursementService.getReimbursements(req.user);
      return sendSuccess(res, { reimbursements });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /rest/reimbursements/:userId
   * CFO or RM — get reimbursements for a specific user.
   */
  async getReimbursementsForUser(req, res, next) {
    try {
      const { userId } = req.params;
      const reimbursements = await reimbursementService.getReimbursementsForUser(
        req.user,
        userId
      );
      return sendSuccess(res, { reimbursements });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReimbursementsController();
