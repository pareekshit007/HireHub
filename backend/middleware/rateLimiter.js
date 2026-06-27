const rateLimit = require('express-rate-limit');

const handler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
  });
};

// General API limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
  // Bypasses the rate limiter entirely if NODE_ENV is set to development
  skip: (req, res) => process.env.NODE_ENV === 'development',
});

// Strict limit for auth routes (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: 'Too many auth attempts. Please try again in 15 minutes.',
  handler,
  skip: (req, res) => process.env.NODE_ENV === 'development',
});

// OTP send limit (prevent OTP spam)
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max:      5,
  standardHeaders: true,
  legacyHeaders:   false,
  skip: (req, res) => process.env.NODE_ENV === 'development',
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
  skip: (req, res) => process.env.NODE_ENV === 'development',
});

module.exports = { apiLimiter, authLimiter, otpLimiter, uploadLimiter };