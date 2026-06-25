'use strict';

const authService = require('../services/AuthService');
const { sendError } = require('../utils/response');

/**
 * authenticate middleware
 * Reads JWT from HTTP-only cookie, verifies it, and attaches user to req.user.
 */
const authenticate = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    const decoded = authService.verifyToken(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return sendError(res, err.message || 'Authentication failed', 401);
  }
};

module.exports = authenticate;
