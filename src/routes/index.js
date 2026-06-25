'use strict';

const express = require('express');
const router = express.Router();

// Controllers
const authController = require('../modules/auth/auth.controller');
const rolesController = require('../modules/roles/roles.controller');
const employeesController = require('../modules/employees/employees.controller');
const reimbursementsController = require('../modules/reimbursements/reimbursements.controller');

// Middleware
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

// Validation schemas
const { registerSchema, loginSchema } = require('../modules/auth/auth.validation');
const { assignRoleSchema } = require('../modules/roles/roles.validation');
const { assignEmployeeSchema, removeAssignmentSchema } = require('../modules/employees/employees.validation');
const {
  createReimbursementSchema,
  approvalSchema,
} = require('../modules/reimbursements/reimbursements.validation');

const { ROLES } = require('../utils/constants');

// ─── Auth Routes ─────────────────────────────────────────────────────────────
/**
 * POST /rest/onboardings/register
 * Open — anyone with @org.com email can register as EMP
 */
router.post(
  '/onboardings/register',
  validate(registerSchema),
  authController.register.bind(authController)
);

/**
 * POST /rest/onboardings/login
 * Open — returns JWT in HTTP-only cookie
 */
router.post(
  '/onboardings/login',
  validate(loginSchema),
  authController.login.bind(authController)
);

/**
 * POST /rest/onboardings/logout
 * Authenticated — clears cookie
 */
router.post(
  '/onboardings/logout',
  authenticate,
  authController.logout.bind(authController)
);

// ─── Role Routes ─────────────────────────────────────────────────────────────
/**
 * POST /rest/roles/assign
 * CFO only — assign EMP/RM/APE role to any user
 */
router.post(
  '/roles/assign',
  authenticate,
  authorize(ROLES.CFO),
  validate(assignRoleSchema),
  rolesController.assignRole.bind(rolesController)
);

// ─── Employee Routes ──────────────────────────────────────────────────────────
/**
 * GET /rest/employees
 * CFO: all users | RM: their assigned employees
 */
router.get(
  '/employees',
  authenticate,
  authorize(ROLES.CFO, ROLES.RM),
  employeesController.getEmployees.bind(employeesController)
);

/**
 * POST /rest/employees/assign
 * CFO only — assign employee to manager
 */
router.post(
  '/employees/assign',
  authenticate,
  authorize(ROLES.CFO),
  validate(assignEmployeeSchema),
  employeesController.assignEmployee.bind(employeesController)
);

/**
 * DELETE /rest/employees/assign
 * CFO only — remove employee-manager assignment
 */
router.delete(
  '/employees/assign',
  authenticate,
  authorize(ROLES.CFO),
  validate(removeAssignmentSchema),
  employeesController.removeAssignment.bind(employeesController)
);

// ─── Reimbursement Routes ─────────────────────────────────────────────────────
/**
 * POST /rest/reimbursements
 * EMP only — create a new reimbursement request
 */
router.post(
  '/reimbursements',
  authenticate,
  authorize(ROLES.EMP),
  validate(createReimbursementSchema),
  reimbursementsController.createReimbursement.bind(reimbursementsController)
);

/**
 * PATCH /rest/reimbursements
 * RM and APE — approve or reject a reimbursement
 */
router.patch(
  '/reimbursements',
  authenticate,
  authorize(ROLES.RM, ROLES.APE),
  validate(approvalSchema),
  reimbursementsController.processApproval.bind(reimbursementsController)
);

/**
 * GET /rest/reimbursements
 * All authenticated roles — returns role-filtered view
 */
router.get(
  '/reimbursements',
  authenticate,
  authorize(ROLES.EMP, ROLES.RM, ROLES.APE, ROLES.CFO),
  reimbursementsController.getReimbursements.bind(reimbursementsController)
);

/**
 * GET /rest/reimbursements/:userId
 * CFO and RM — get reimbursements for a specific user
 */
router.get(
  '/reimbursements/:userId',
  authenticate,
  authorize(ROLES.CFO, ROLES.RM),
  reimbursementsController.getReimbursementsForUser.bind(reimbursementsController)
);

module.exports = router;
