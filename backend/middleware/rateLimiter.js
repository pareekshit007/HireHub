const rateLimit = require('express-rate-limit');

const handler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
  });
};

// In development, only skip rate limiting for requests from localhost
const skipLocalhost = (req) => {
  if (process.env.NODE_ENV !== 'development') return false;
  const ip = req.ip || req.connection.remoteAddress || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
};

// General API limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
  skip: skipLocalhost,
});

// Strict limit for auth routes (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
  skip: skipLocalhost,
});

// OTP send limit (prevent OTP spam)
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max:      5,
  standardHeaders: true,
  legacyHeaders:   false,
  skip: skipLocalhost,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many OTP requests. Please try again in 1 hour.',
    });
  },
});

// File upload limit
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
  skip: skipLocalhost,
});

module.exports = { apiLimiter, authLimiter, otpLimiter, uploadLimiter };