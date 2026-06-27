const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const { protect, requireVerified, authorize } = require('../middleware/authMiddleware');
const { handleResumeUpload, handleLogoUpload, deleteFromCloudinary } = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { sendSuccess, sendError, asyncHandler } = require('../utils/apiHelpers');
const User = require('../models/User');

// ── GET /api/users/profile ────────────────────────────────────────────────────
router.get('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return sendSuccess(res, { user });
}));

// ── PUT /api/users/profile ────────────────────────────────────────────────────
router.put('/profile', protect, asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { name, avatar } },
    { new: true, runValidators: true }
  );

  return sendSuccess(res, { user }, 'Profile updated');
}));

// ── PUT /api/users/seeker-profile ─────────────────────────────────────────────
router.put('/seeker-profile', protect, authorize('seeker'), asyncHandler(async (req, res) => {
  const allowed = ['headline', 'bio', 'location', 'phone', 'skills',
                   'experience', 'education', 'portfolioUrl', 'linkedinUrl', 'githubUrl'];

  const updateObj = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateObj[`seekerProfile.${field}`] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateObj },
    { new: true, runValidators: true }
  );

  return sendSuccess(res, { user }, 'Seeker profile updated');
}));

// ── PUT /api/users/employer-profile ──────────────────────────────────────────
router.put('/employer-profile', protect, authorize('employer'), asyncHandler(async (req, res) => {
  const allowed = ['companyName', 'companyWebsite', 'companySize', 'industry', 'description', 'location'];

  const updateObj = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateObj[`employerProfile.${field}`] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateObj },
    { new: true, runValidators: true }
  );

  return sendSuccess(res, { user }, 'Employer profile updated');
}));

// ── POST /api/users/upload-resume ─────────────────────────────────────────────
router.post(
  '/upload-resume',
  protect,
  requireVerified,
  authorize('seeker'),
  uploadLimiter,
  handleResumeUpload,
  asyncHandler(async (req, res) => {
    if (!req.uploadedFile) return sendError(res, 'No file uploaded', 400);

    const user = await User.findById(req.user._id);

    // Delete old resume from Cloudinary
    if (user.seekerProfile?.resumePublicId) {
      await deleteFromCloudinary(user.seekerProfile.resumePublicId, 'raw');
    }

    user.seekerProfile.resumeUrl      = req.uploadedFile.url;
    user.seekerProfile.resumePublicId = req.uploadedFile.publicId;
    await user.save({ validateBeforeSave: false });

    return sendSuccess(res, { resumeUrl: req.uploadedFile.url }, 'Resume uploaded');
  })
);

// ── POST /api/users/upload-logo ───────────────────────────────────────────────
router.post(
  '/upload-logo',
  protect,
  requireVerified,
  authorize('employer'),
  uploadLimiter,
  handleLogoUpload,
  asyncHandler(async (req, res) => {
    if (!req.uploadedFile) return sendError(res, 'No file uploaded', 400);

    const user = await User.findById(req.user._id);

    if (user.employerProfile?.logoPublicId) {
      await deleteFromCloudinary(user.employerProfile.logoPublicId);
    }

    user.employerProfile.logoUrl      = req.uploadedFile.url;
    user.employerProfile.logoPublicId = req.uploadedFile.publicId;
    await user.save({ validateBeforeSave: false });

    return sendSuccess(res, { logoUrl: req.uploadedFile.url }, 'Logo uploaded');
  })
);

// ── PUT /api/users/change-password ────────────────────────────────────────────
router.put('/change-password', protect, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (user.authProvider === 'google') {
    return sendError(res, 'Google accounts cannot change password here', 400);
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) return sendError(res, 'Current password is incorrect', 400);

  if (newPassword.length < 6) return sendError(res, 'New password must be at least 6 characters', 400);

  user.password = newPassword;
  await user.save();

  return sendSuccess(res, {}, 'Password changed successfully');
}));

// ── GET /api/users/public/:id — public employer profile ───────────────────────
router.get('/public/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('name avatar role employerProfile seekerProfile createdAt');

  if (!user) return sendError(res, 'User not found', 404);
  return sendSuccess(res, { user });
}));

module.exports = router;
