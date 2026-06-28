const express  = require('express');
const router   = express.Router();
const SavedJob = require('../models/SavedJob');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/authMiddleware');
const { sendSuccess, sendError, asyncHandler, getPagination, paginationMeta } = require('../utils/apiHelpers');

router.post('/:jobId', protect, authorize('seeker'), asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job || job.status !== 'active') return sendError(res, 'Job not found', 404);
  const existing = await SavedJob.findOne({ user: req.user._id, job: req.params.jobId });
  if (existing) { await existing.deleteOne(); return sendSuccess(res, { saved: false }, 'Job removed from saved list'); }
  await SavedJob.create({ user: req.user._id, job: req.params.jobId });
  return sendSuccess(res, { saved: true }, 'Job saved', 201);
}));

router.get('/', protect, authorize('seeker'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [savedJobs, total] = await Promise.all([
    SavedJob.find({ user: req.user._id })
      .populate({ path: 'job', select: 'title location jobType workMode salary category status deadline skills',
        populate: { path: 'employer', select: 'name employerProfile.companyName employerProfile.logoUrl' } })
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
    SavedJob.countDocuments({ user: req.user._id }),
  ]);
  return sendSuccess(res, { savedJobs: savedJobs.filter((s) => s.job?.status === 'active'), pagination: paginationMeta(total, page, limit) });
}));

router.get('/check/:jobId', protect, authorize('seeker'), asyncHandler(async (req, res) => {
  const saved = await SavedJob.findOne({ user: req.user._id, job: req.params.jobId });
  return sendSuccess(res, { saved: !!saved });
}));

router.delete('/:jobId', protect, authorize('seeker'), asyncHandler(async (req, res) => {
  await SavedJob.findOneAndDelete({ user: req.user._id, job: req.params.jobId });
  return sendSuccess(res, { saved: false }, 'Job removed from saved list');
}));

module.exports = router;