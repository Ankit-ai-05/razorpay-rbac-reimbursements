'use strict';

const authService = require('../../services/AuthService');
const { sendSuccess, sendError } = require('../../utils/response');
const jwtConfig = require('../../config/jwt');

class AuthController {
  /**
   * POST /rest/onboardings/register
   */
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      return sendSuccess(res, { user }, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /rest/onboardings/login
   * Sets JWT in HTTP-only cookie on success.
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { token, user } = await authService.login(email, password);

      res.cookie('token', token, jwtConfig.cookieOptions);

      return sendSuccess(res, { user }, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /rest/onboardings/logout
   * Clears the JWT cookie.
   */
  async logout(req, res, next) {
    try {
      res.clearCookie('token', {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        secure: process.env.NODE_ENV === 'production',
      });
      return sendSuccess(res, { message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
