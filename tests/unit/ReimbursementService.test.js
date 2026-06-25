'use strict';

process.env.NODE_ENV = 'test';
require('dotenv').config();

jest.mock('../../src/repositories/ReimbursementRepository');
jest.mock('../../src/repositories/ReimbursementApprovalRepository');
jest.mock('../../src/repositories/EmployeeManagerRepository');

const reimbursementRepository = require('../../src/repositories/ReimbursementRepository');
const reimbursementApprovalRepository = require('../../src/repositories/ReimbursementApprovalRepository');
const employeeManagerRepository = require('../../src/repositories/EmployeeManagerRepository');
const reimbursementService = require('../../src/services/ReimbursementService');
const AppError = require('../../src/utils/AppError');
const { ROLES, REIMBURSEMENT_STATUS, DECISION } = require('../../src/utils/constants');

const mockReimbursement = (overrides = {}) => ({
  id: 'reimb-uuid-1',
  employee_id: 'emp-uuid-1',
  title: 'Travel Expenses',
  amount: 500,
  final_status: REIMBURSEMENT_STATUS.PENDING,
  ...overrides,
});

describe('ReimbursementService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createReimbursement', () => {
    it('should create a reimbursement with PENDING status', async () => {
      const created = mockReimbursement();
      reimbursementRepository.create.mockResolvedValue(created);

      const result = await reimbursementService.createReimbursement('emp-uuid-1', {
        title: 'Travel Expenses',
        amount: 500,
      });

      expect(result.final_status).toBe(REIMBURSEMENT_STATUS.PENDING);
      expect(reimbursementRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ employee_id: 'emp-uuid-1', final_status: 'PENDING' })
      );
    });
  });

  describe('processApproval - RM', () => {
    it('should reject if employee not assigned to RM', async () => {
      reimbursementRepository.findById.mockResolvedValue(mockReimbursement());
      reimbursementApprovalRepository.findByReimbursementAndRole.mockResolvedValue(null);
      employeeManagerRepository.findEmployeesByManager.mockResolvedValue([
        { id: 'other-emp-uuid' },
      ]);

      await expect(
        reimbursementService.processApproval(
          { id: 'rm-uuid', role: ROLES.RM },
          'reimb-uuid-1',
          DECISION.APPROVED
        )
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('should reject if already rejected reimbursement', async () => {
      reimbursementRepository.findById.mockResolvedValue(
        mockReimbursement({ final_status: REIMBURSEMENT_STATUS.REJECTED })
      );

      await expect(
        reimbursementService.processApproval(
          { id: 'rm-uuid', role: ROLES.RM },
          'reimb-uuid-1',
          DECISION.APPROVED
        )
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should reject double-action by same role', async () => {
      reimbursementRepository.findById.mockResolvedValue(mockReimbursement());
      reimbursementApprovalRepository.findByReimbursementAndRole.mockResolvedValue({
        id: 'existing-approval',
      });

      await expect(
        reimbursementService.processApproval(
          { id: 'rm-uuid', role: ROLES.RM },
          'reimb-uuid-1',
          DECISION.APPROVED
        )
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('processApproval - APE', () => {
    it('should reject if RM has not approved yet', async () => {
      reimbursementRepository.findById.mockResolvedValue(mockReimbursement());
      reimbursementApprovalRepository.findByReimbursementAndRole.mockResolvedValue(null);
      reimbursementApprovalRepository.isRmApproved.mockResolvedValue(false);

      await expect(
        reimbursementService.processApproval(
          { id: 'ape-uuid', role: ROLES.APE },
          'reimb-uuid-1',
          DECISION.APPROVED
        )
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('final status computation', () => {
    it('should set APPROVED when both RM and APE approve', async () => {
      reimbursementRepository.findById
        .mockResolvedValueOnce(mockReimbursement()) // first call in processApproval
        .mockResolvedValueOnce(mockReimbursement({ final_status: REIMBURSEMENT_STATUS.APPROVED })); // final findById

      reimbursementApprovalRepository.findByReimbursementAndRole.mockResolvedValue(null);
      reimbursementApprovalRepository.isRmApproved.mockResolvedValue(true); // RM already approved
      reimbursementApprovalRepository.create.mockResolvedValue({});
      reimbursementRepository.updateStatus.mockResolvedValue([1]);

      const result = await reimbursementService.processApproval(
        { id: 'ape-uuid', role: ROLES.APE },
        'reimb-uuid-1',
        DECISION.APPROVED
      );

      expect(reimbursementRepository.updateStatus).toHaveBeenCalledWith(
        'reimb-uuid-1',
        REIMBURSEMENT_STATUS.APPROVED
      );
    });

    it('should set REJECTED if anyone rejects', async () => {
      reimbursementRepository.findById
        .mockResolvedValueOnce(mockReimbursement())
        .mockResolvedValueOnce(mockReimbursement({ final_status: REIMBURSEMENT_STATUS.REJECTED }));

      reimbursementApprovalRepository.findByReimbursementAndRole.mockResolvedValue(null);
      employeeManagerRepository.findEmployeesByManager.mockResolvedValue([{ id: 'emp-uuid-1' }]);
      reimbursementApprovalRepository.create.mockResolvedValue({});
      reimbursementRepository.updateStatus.mockResolvedValue([1]);

      await reimbursementService.processApproval(
        { id: 'rm-uuid', role: ROLES.RM },
        'reimb-uuid-1',
        DECISION.REJECTED,
        'Insufficient documentation'
      );

      expect(reimbursementRepository.updateStatus).toHaveBeenCalledWith(
        'reimb-uuid-1',
        REIMBURSEMENT_STATUS.REJECTED
      );
    });
  });
});
