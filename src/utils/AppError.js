'use strict';

/**
 * Custom operational error class.
 * Distinguishes between programmer errors (bugs) and operational errors (predictable failures).
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message for client
   * @param {number} statusCode - HTTP status code
   * @param {boolean} isOperational - Mark as expected/handled error (default true)
   */
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    // Maintain proper prototype chain in ES6
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
