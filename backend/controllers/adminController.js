const User        = require('../models/User');
const Job         = require('../models/Job');
const Application = require('../models/Application');
const { Notification } = require('../models/SavedJob');
const { sendSuccess, sendError, asyncHandler, getPagination, paginationMeta } = require('../utils/apiHelpers');

exports.getStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalSeekers, totalEmployers, totalJobs, activeJobs, pendingJobs, totalApplications, recentUsers, recentJobs] = await Promise.all([
    User.countDocuments(), User.countDocuments({ role: 'seeker' }), User.countDocuments({ role: 'employer' }),
    Job.countDocuments(), Job.countDocuments({ status: 'active' }), Job.countDocuments({ status: 'pending' }),
    Application.countDocuments(),
    User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt avatar'),
    Job.find().sort({ createdAt: -1 }).limit(5).populate('employer', 'name employerProfile.companyName').select('title status createdAt category'),
  ]);
  const last7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [appsByDay, jobsByCategory] = await Promise.all([
    Application.aggregate([
      { $match: { createdAt: { $gte: last7 } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Job.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 8 },
    ]),
  ]);
  return sendSuccess(res, {
    stats: {
      users: { total: totalUsers, seekers: totalSeekers, employers: totalEmployers },
      jobs: { total: totalJobs, active: activeJobs, pending: pendingJobs },
      applications: { total: totalApplications },
    },
    recentUsers, recentJobs,
    charts: { appsByDay, jobsByCategory },
  });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { role, search, isVerified, isBanned } = req.query;
  const filter = {};
  if (role)       filter.role       = role;
  if (isVerified) filter.isVerified = isVerified === 'true';
  if (isBanned)   filter.isBanned   = isBanned   === 'true';
  if (search)     filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  const [users, total] = await Promise.all([
    User.find(filter).select('-password -otp -refreshTokens').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return sendSuccess(res, { users, pagination: paginationMeta(total, page, limit) });
});

exports.getUserDetail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -otp -refreshTokens');
  if (!user) return sendError(res, 'User not found', 404);
  let extra = {};
  if (user.role === 'employer') extra.jobCount = await Job.countDocuments({ employer: user._id });
  if (user.role === 'seeker')   extra.applicationCount = await Application.countDocuments({ applicant: user._id });
  return sendSuccess(res, { user, ...extra });
});

exports.toggleBan = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'User not found', 404);
  if (user.role === 'admin') return sendError(res, 'Cannot ban another admin', 403);
  user.isBanned = !user.isBanned;
  if (user.isBanned) user.refreshTokens = [];
  await user.save({ validateBeforeSave: false });
  return sendSuccess(res, { isBanned: user.isBanned }, `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'User not found', 404);
  if (user.role === 'admin') return sendError(res, 'Cannot delete an admin account', 403);
  if (user.role === 'employer') {
    const jobs = await Job.find({ employer: user._id }).select('_id');
    await Application.deleteMany({ job: { $in: jobs.map((j) => j._id) } });
    await Job.deleteMany({ employer: user._id });
  }
  if (user.role === 'seeker') await Application.deleteMany({ applicant: user._id });
  await user.deleteOne();
  return sendSuccess(res, {}, 'User deleted');
});

exports.getJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.$text  = { $search: req.query.search };
  const [jobs, total] = await Promise.all([
    Job.find(filter).populate('employer', 'name email employerProfile.companyName').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Job.countDocuments(filter),
  ]);
  return sendSuccess(res, { jobs, pagination: paginationMeta(total, page, limit) });
});

exports.setupAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, setupKey } = req.body;
  if (setupKey !== process.env.ADMIN_SETUP_KEY) return sendError(res, 'Invalid setup key', 403);
  const exists = await User.findOne({ role: 'admin' });
  if (exists) return sendError(res, 'Admin account already exists', 409);
  const admin = await User.create({ name, email, password, role: 'admin', isVerified: true, authProvider: 'local' });
  return sendSuccess(res, { admin: { _id: admin._id, email: admin.email } }, 'Admin created', 201);
});