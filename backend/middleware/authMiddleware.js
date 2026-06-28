const User            = require('../models/User');
const { verifyToken } = require('../utils/tokenUtils');
const { sendError }   = require('../utils/apiHelpers');

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

    const user = await User.findById(decoded.id).select('-password -otp.code -otp.expiresAt -otp.attempts -refreshTokens');

    if (!user)                        return sendError(res, 'User not found', 401);
    if (!user.isActive || user.isBanned) return sendError(res, 'Account suspended. Contact support.', 403);

    req.user = user;
    next();
  } catch (err) {
    console.error('🔴 protect middleware error:', err.message, err.stack?.split('\n')[1]);
    next(err);  // ← pass to errorHandler instead of swallowing
  }
};

const requireVerified = (req, res, next) => {
  if (!req.user?.isVerified)
    return sendError(res, 'Please verify your email address first', 403);
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role))
    return sendError(res, `Role '${req.user?.role}' is not authorized for this resource`, 403);
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token   = authHeader.split(' ')[1];
      const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);
      if (decoded) {
        const user = await User.findById(decoded.id).select('-password -otp.code -otp.expiresAt -otp.attempts -refreshTokens');
        if (user?.isActive && !user.isBanned) req.user = user;
      }
    }
  } catch (_) {}
  next();
};

module.exports = { protect, requireVerified, authorize, optionalAuth };