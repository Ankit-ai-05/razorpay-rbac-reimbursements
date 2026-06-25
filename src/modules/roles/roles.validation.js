'use strict';

const Joi = require('joi');
const { ROLES } = require('../../utils/constants');

const assignRoleSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    'string.uuid': 'userId must be a valid UUID',
    'any.required': 'userId is required',
  }),
  role: Joi.string()
    .valid(ROLES.EMP, ROLES.RM, ROLES.APE)
    .required()
    .messages({
      'any.only': `role must be one of: ${ROLES.EMP}, ${ROLES.RM}, ${ROLES.APE}`,
      'any.required': 'role is required',
    }),
});

module.exports = { assignRoleSchema };
