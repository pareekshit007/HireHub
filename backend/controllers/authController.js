const User = require('../models/User');
const Notification = require('../models/Notification');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require('../utils/tokenUtils');
const { sendSuccess, sendError, asyncHandler } = require('../utils/apiHelpers');

const MAX_SESSIONS = 5;

// ── Helper: issue tokens ──────────────────────────────────────────────────────
const sendTokenResponse = async (res, user, statusCode = 200, message = 'Success') => {
  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  await User.findByIdAndUpdate(user._id, [
    { $set: {
      refreshTokens: {
        $slice: [{ $concatArrays: ['$refreshTokens', [refreshToken]] }, -MAX_SESSIONS]
      },
      lastLogin: new Date(),
    }},
  ]);

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
exports.register = asyncHandler(async (req, res) => {
  const { name, password, role } = req.body;
  const email = req.body.email?.toLowerCase().trim();

  if (!name || !email || !password) return sendError(res, 'Name, email and password are required', 400);

  const exists = await User.findOne({ email });
  if (exists) return sendError(res, 'Email already registered. Please login.', 409);

  const allowedRoles = ['seeker', 'employer'];
  const userRole     = allowedRoles.includes(role) ? role : 'seeker';

  const user = await User.create({
    name,
    email,
    password,
    role:         userRole,
    authProvider: 'local',
    isVerified:   true,   // no OTP — auto-verify
  });

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
  const email = req.body.email?.toLowerCase().trim();
  const { password } = req.body;

  if (!email || !password) return sendError(res, 'Email and password are required', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user) return sendError(res, 'Invalid email or password', 401);

  if (user.authProvider === 'google')
    return sendError(res, 'This account uses Google Sign-In. Please use Google to login.', 400);

  if (!user.isActive || user.isBanned)
    return sendError(res, 'Account suspended. Contact support.', 403);

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return sendError(res, 'Invalid email or password', 401);

  return sendTokenResponse(res, user, 200, 'Login successful');
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return sendError(res, 'No refresh token', 401);

  const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET);
  if (!decoded)  return sendError(res, 'Invalid refresh token', 401);

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user) return sendError(res, 'User not found', 401);

  if (!user.refreshTokens.includes(token)) {
    await User.findByIdAndUpdate(user._id, { refreshTokens: [] });
    clearRefreshCookie(res);
    return sendError(res, 'Token reuse detected. Please login again.', 401);
  }

  const newRefresh = generateRefreshToken(user._id);
  const updatedTokens = user.refreshTokens
    .filter((t) => t !== token)
    .concat(newRefresh)
    .slice(-MAX_SESSIONS);

  await User.findByIdAndUpdate(user._id, { refreshTokens: updatedTokens });

  setRefreshCookie(res, newRefresh);
  const accessToken = generateAccessToken(user._id, user.role);

  return sendSuccess(res, { accessToken }, 'Token refreshed');
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    // use token to find user — don't rely on req.user which may be undefined
    const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET);
    if (decoded?.id) {
      await User.findByIdAndUpdate(decoded.id, { $pull: { refreshTokens: token } });
    }
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

// ── POST /api/auth/forgot-password — email disabled, return instructions ──────
exports.forgotPassword = asyncHandler(async (req, res) => {
  return sendError(res, 'Password reset via email is currently disabled. Contact admin.', 503);
});

// ── POST /api/auth/reset-password — disabled ──────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  return sendError(res, 'Password reset is currently disabled.', 503);
});

// ── Google OAuth callback ─────────────────────────────────────────────────────
exports.googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);

  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  await User.findByIdAndUpdate(user._id, [
    { $set: {
      refreshTokens: {
        $slice: [{ $concatArrays: ['$refreshTokens', [refreshToken]] }, -MAX_SESSIONS]
      },
      lastLogin: new Date(),
    }},
  ]);

  // Set refresh token in httpOnly cookie (same as regular login)
  setRefreshCookie(res, refreshToken);

  // Set access token in a short-lived non-httpOnly cookie so the frontend
  // can read it once and store it in memory — never expose it in the URL
  res.cookie('oauthAccessToken', accessToken, {
    httpOnly: false,           // frontend JS must be able to read it
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 1000,       // 60 seconds — one-time handoff only
  });

  res.redirect(`${process.env.CLIENT_URL}/oauth-success`);
});

// ── OTP routes — disabled ─────────────────────────────────────────────────────
exports.verifyOTP = (req, res) =>
  res.status(410).json({ success: false, message: 'OTP verification is disabled.' });
exports.resendOTP = (req, res) =>
  res.status(410).json({ success: false, message: 'OTP verification is disabled.' });