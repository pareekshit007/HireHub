const User      = require('../models/User');
const { verifyToken } = require('../utils/tokenUtils');
const { sendError }   = require('../utils/apiHelpers');

/**
 * protect — verify JWT access token, attach req.user
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Not authorized — no token', 401);
    }

    const token   = authHeader.split(' ')[1];
    const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);

    if (!decoded) {
      return sendError(res, 'Not authorized — token invalid or expired', 401);
    }

    const user = await User.findById(decoded.id).select('-password -otp -refreshTokens');

    if (!user) {
      return sendError(res, 'User not found', 401);
    }

    if (!user.isActive || user.isBanned) {
      return sendError(res, 'Account suspended. Contact support.', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    return sendError(res, 'Auth middleware error', 500);
  }
};

/**
 * requireVerified — user must have verified email
 */
const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return sendError(res, 'Please verify your email address first', 403);
  }
  next();
};

/**
 * authorize(...roles) — role-based access control
 * Usage: authorize('admin'), authorize('employer', 'admin')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return sendError(
      res,
      `Role '${req.user.role}' is not authorized for this resource`,
      403
    );
  }
  next();
};

/**
 * optionalAuth — attach user if token present, don't fail if not
 * Useful for public routes that show extra info to logged-in users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token   = authHeader.split(' ')[1];
      const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);
      if (decoded) {
        const user = await User.findById(decoded.id).select('-password -otp -refreshTokens');
        if (user && user.isActive && !user.isBanned) {
          req.user = user;
        }
      }
    }
  } catch (_) {
    // silently skip
  }
  next();
};

module.exports = { protect, requireVerified, authorize, optionalAuth };
