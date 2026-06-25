'use strict';

const { sendError } = require('../utils/response');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * Global error handler middleware.
 * Must be registered LAST with 4 arguments for Express to recognize it as error handler.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(err);

  // Operational errors (known, expected failures)
  if (err instanceof AppError && err.isOperational) {
    return sendError(res, err.message, err.statusCode);
  }

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors?.map((e) => e.message).join(', ') || err.message;
    return sendError(res, messages, 400);
  }

  // JWT errors (malformed, expired, etc.)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, 'Invalid or expired session. Please log in again.', 401);
  }

  // Unknown / programmer errors — don't leak details
  return sendError(res, 'An internal server error occurred', 500);
};

module.exports = errorHandler;
