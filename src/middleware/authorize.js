'use strict';

const { sendError } = require('../utils/response');

/**
 * authorize factory — returns middleware that allows access only to specified roles.
 * @param {...string} roles Allowed role strings (e.g., 'CFO', 'RM')
 * @returns {Function} Express middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required roles: ${roles.join(', ')}`,
        403
      );
    }

    next();
  };
};

module.exports = authorize;
