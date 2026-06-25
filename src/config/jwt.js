'use strict';

module.exports = {
  secret: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: parseInt(process.env.COOKIE_MAX_AGE_MS, 10) || 86400000, // 24h
  },
};
