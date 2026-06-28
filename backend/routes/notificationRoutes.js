const express = require('express');
const router  = express.Router();

const { protect }  = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const { sendSuccess, sendError, asyncHandler, getPagination, paginationMeta } = require('../utils/apiHelpers');

// GET /api/notifications — paginated list for logged-in user
router.get('/', protect, asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const unreadOnly = req.query.unread === 'true';

  const filter = { recipient: req.user._id };
  if (unreadOnly) filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  return sendSuccess(res, {
    notifications,
    unreadCount,
    pagination: paginationMeta(total, page, limit),
  });
}));

// PUT /api/notifications/:id/read — mark single as read
router.put('/:id/read', protect, asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notif) return sendError(res, 'Notification not found', 404);
  return sendSuccess(res, { notification: notif }, 'Marked as read');
}));

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', protect, asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );
  return sendSuccess(res, {}, 'All notifications marked as read');
}));

// DELETE /api/notifications/:id
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndDelete({
    _id: req.params.id, recipient: req.user._id,
  });
  if (!notif) return sendError(res, 'Notification not found', 404);
  return sendSuccess(res, {}, 'Notification deleted');
}));

module.exports = router;