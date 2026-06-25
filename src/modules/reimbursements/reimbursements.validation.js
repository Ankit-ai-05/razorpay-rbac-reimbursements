'use strict';

const Joi = require('joi');
const { DECISION } = require('../../utils/constants');

const createReimbursementSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    'string.min': 'Title must be at least 3 characters',
    'string.max': 'Title cannot exceed 200 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().max(2000).optional().allow('', null),
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be a positive number',
    'any.required': 'Amount is required',
  }),
});

const approvalSchema = Joi.object({
  reimbursementId: Joi.string().uuid().required().messages({
    'string.uuid': 'reimbursementId must be a valid UUID',
    'any.required': 'reimbursementId is required',
  }),
  decision: Joi.string()
    .valid(DECISION.APPROVED, DECISION.REJECTED)
    .required()
    .messages({
      'any.only': `decision must be either APPROVED or REJECTED`,
      'any.required': 'decision is required',
    }),
  remarks: Joi.string().max(500).optional().allow('', null),
});

module.exports = { createReimbursementSchema, approvalSchema };
