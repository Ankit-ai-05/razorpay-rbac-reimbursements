'use strict';

const Joi = require('joi');

const assignEmployeeSchema = Joi.object({
  employeeId: Joi.string().uuid().required().messages({
    'string.uuid': 'employeeId must be a valid UUID',
    'any.required': 'employeeId is required',
  }),
  managerId: Joi.string().uuid().required().messages({
    'string.uuid': 'managerId must be a valid UUID',
    'any.required': 'managerId is required',
  }),
});

const removeAssignmentSchema = Joi.object({
  employeeId: Joi.string().uuid().required().messages({
    'string.uuid': 'employeeId must be a valid UUID',
    'any.required': 'employeeId is required',
  }),
  managerId: Joi.string().uuid().required().messages({
    'string.uuid': 'managerId must be a valid UUID',
    'any.required': 'managerId is required',
  }),
});

module.exports = { assignEmployeeSchema, removeAssignmentSchema };
