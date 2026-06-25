'use strict';

/**
 * Standard success response wrapper.
 * @param {object} res - Express response object
 * @param {*} data - Payload to send
 * @param {number} statusCode - HTTP status code (default 200)
 */
const sendSuccess = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    data,
  });
};

/**
 * Standard error response wrapper.
 * @param {object} res - Express response object
 * @param {string} message - Human-readable error description
 * @param {number} statusCode - HTTP status code (default 400)
 */
const sendError = (res, message = 'Something went wrong', statusCode = 400) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
  });
};

module.exports = { sendSuccess, sendError };
