'use strict';

const { sendError } = require('../utils/response');

/**
 * validate factory — creates middleware that validates req.body against a Joi schema.
 * @param {import('joi').Schema} schema Joi schema
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false, // collect all errors
      stripUnknown: true, // strip unknown keys for safety
    });

    if (error) {
      const message = error.details.map((d) => d.message).join('; ');
      return sendError(res, message, 422);
    }

    next();
  };
};

module.exports = validate;
