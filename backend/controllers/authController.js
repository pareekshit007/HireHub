const User = require('../models/User');
const { Notification } = require('../models/SavedJob');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require('../utils/tokenUtils');
const { sendSuccess, sendError, asyncHandler } = require('../utils/apiHelpers');

// ── Helper: issue tokens ──────────────────────────────────────────────────────
const sendTokenResponse = async (res, user, statusCode = 200, message = 'Success') => {
  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  await User.findByIdAndUpdate(user._id, {
    $push:     { refreshTokens: refreshToken },
    lastLogin: new Date(),
  });

  setRefreshCookie(res, refreshToken);

  return sendSuccess(res, {
    accessToken,
    user: {
      _id:        user._id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      avatar:     user.avatar,
      isVerified: user.isVerified,
    },
  }, message, statusCode);
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
// OTP removed: user is auto-verified and logged in immediately on register
exports.register = asyncHandler(async (req, res) => {
  const { name, password, role } = req.body;
  const email = req.body.email.toLowerCase().trim();

  const exists = await User.findOne({ email });
  if (exists) {
    return sendError(res, 'Email already registered. Please login.', 409);
  }

  const allowedRoles = ['seeker', 'employer'];
  const userRole     = allowedRoles.includes(role) ? role : 'seeker';

  const user = new User({
    name,
    email,
    password,
    role:       userRole,
    authProvider: 'local',
    isVerified: true, // ← skip OTP, auto-verify
  });

  await user.save();

  await Notification.create({
    recipient: user._id,
    type:      'account_verified',
    title:     'Welcome to HireHub!',
    message:   'Your account is ready. Start exploring jobs.',
    link:      '/jobs',
  });

  return sendTokenResponse(res, user, 201, 'Account created successfully');
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase().trim();
  const { password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) return sendError(res, 'Invalid email or password', 401);

  if (user.authProvider === 'google') {
    return sendError(res, 'This account uses Google Sign-In. Please use Google to login.', 400);
  }

  if (!user.isActive || user.isBanned) {
    return sendError(res, 'Account suspended. Contact support.', 403);
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return sendError(res, 'Invalid email or password', 401);

  return sendTokenResponse(res, user, 200, 'Login successful');
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return sendError(res, 'No refresh token', 401);

  const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET);
  if (!decoded) return sendError(res, 'Invalid refresh token', 401);

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user) return sendError(res, 'User not found', 401);

  if (!user.refreshTokens.includes(token)) {
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });
    clearRefreshCookie(res);
    return sendError(res, 'Token reuse detected. Please login again.', 401);
  }

  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
  const newRefresh   = generateRefreshToken(user._id);
  user.refreshTokens.push(newRefresh);
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, newRefresh);
  const accessToken = generateAccessToken(user._id, user.role);

  return sendSuccess(res, { accessToken }, 'Token refreshed');
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await User.findByIdAndUpdate(req.user._id, { $pull: { refreshTokens: token } });
  }
  clearRefreshCookie(res);
  return sendSuccess(res, {}, 'Logged out successfully');
});

// ── POST /api/auth/logout-all ─────────────────────────────────────────────────
exports.logoutAll = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshTokens: [] });
  clearRefreshCookie(res);
  return sendSuccess(res, {}, 'Logged out from all devices');
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return sendSuccess(res, { user });
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase().trim();
  const user  = await User.findOne({ email }).select('+otp');

  if (!user || user.authProvider === 'google') {
    return sendSuccess(res, {}, 'If that email exists, a reset OTP has been sent.');
  }

  const { sendOTPEmail } = require('../utils/emailUtils');
  const otp = user.generateOTP();
  await user.save({ validateBeforeSave: false });

  try {
    await sendOTPEmail(email, user.name, otp);
  } catch (e) {
    console.warn('⚠️  Email failed, reset OTP for', email, ':', otp);
  }

  return sendSuccess(res, {}, 'Password reset OTP sent to your email.');
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase().trim();
  const { otp, newPassword } = req.body;

  const user = await User.findOne({ email }).select('+otp +password');
  if (!user) return sendError(res, 'User not found', 404);

  if (!user.otp?.code || new Date() > user.otp?.expiresAt) {
    return sendError(res, 'OTP expired or not found. Request a new one.', 400);
  }

  if (user.otp.code !== otp.toString()) {
    user.otp.attempts += 1;
    await user.save({ validateBeforeSave: false });
    return sendError(res, 'Invalid OTP', 400);
  }

  user.password      = newPassword;
  user.refreshTokens = [];
  user.clearOTP();
  await user.save();

  clearRefreshCookie(res);
  return sendSuccess(res, {}, 'Password reset successful. Please login again.');
});

// ── Google OAuth callback ─────────────────────────────────────────────────────
exports.googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);

  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  await User.findByIdAndUpdate(user._id, {
    $push:     { refreshTokens: refreshToken },
    lastLogin: new Date(),
  });

  setRefreshCookie(res, refreshToken);
  res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${accessToken}&role=${user.role}`);
});

// ── Stubs for OTP routes (kept so routes don't 404 if called) ────────────────
exports.verifyOTP  = (req, res) => res.status(410).json({ success: false, message: 'OTP verification is disabled.' });
exports.resendOTP  = (req, res) => res.status(410).json({ success: false, message: 'OTP verification is disabled.' });