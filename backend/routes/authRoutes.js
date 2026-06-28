const express  = require('express');
const { body } = require('express-validator');
const passport = require('../config/passport');
const router   = express.Router();

const authController = require('../controllers/authController');
const { protect }    = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// ── Validation chains ─────────────────────────────────────────────────────────
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 80 }).withMessage('Name too long'),
  body('email')
    .isEmail().withMessage('Valid email required')
    .toLowerCase(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['seeker', 'employer']).withMessage('Invalid role'),
];

const loginValidation = [
  body('email').isEmail().toLowerCase(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Validation error middleware ────────────────────────────────────────────────
const { validationResult } = require('express-validator');
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors:  errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Active routes ─────────────────────────────────────────────────────────────
router.post('/register',   authLimiter, registerValidation, validate, authController.register);
router.post('/login',      authLimiter, loginValidation,    validate, authController.login);
router.post('/refresh',    authController.refreshToken);
router.post('/logout',     protect, authController.logout);
router.post('/logout-all', protect, authController.logoutAll);
router.get( '/me',         protect, authController.getMe);

// ── Disabled routes (email/OTP not configured yet) ────────────────────────────
const disabled = (req, res) =>
  res.status(503).json({ success: false, message: 'This feature is not available yet.' });

router.post('/verify-otp',      disabled);
router.post('/resend-otp',      disabled);
router.post('/forgot-password', disabled);
router.post('/reset-password',  disabled);

// ── Google OAuth (only registered when real credentials are provided) ─────────
if (
  process.env.GOOGLE_CLIENT_ID !== 'skip_for_now' &&
  process.env.GOOGLE_CLIENT_SECRET !== 'skip_for_now'
) {
  router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed` }),
    authController.googleCallback
  );
}

module.exports = router;