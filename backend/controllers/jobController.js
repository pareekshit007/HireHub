const Job          = require('../models/Job');
const Application  = require('../models/Application');
const Notification = require('../models/Notification');
const { sendJobStatusEmail } = require('../utils/emailUtils');
const {
  sendSuccess, sendError, asyncHandler,
  getPagination, paginationMeta,
} = require('../utils/apiHelpers');

exports.createJob = asyncHandler(async (req, res) => {
  const {
    title, description, requirements, responsibilities,
    category, jobType, workMode, experienceLevel,
    location, salary, skills, deadline, openings,
  } = req.body;

  const job = await Job.create({
    title, description, requirements, responsibilities,
    category, jobType, workMode, experienceLevel,
    location, salary, skills, deadline, openings,
    employer: req.user._id,
    status: 'pending',
  });

  await Notification.create({
    recipient: req.user._id,
    type:      'general',
    title:     'Job submitted for review',
    message:   `Your job "${title}" has been submitted and is pending admin approval.`,
    link:      `/employer/jobs`,
    relatedJob: job._id,
  });

  return sendSuccess(res, { job }, 'Job submitted for review', 201);
});

exports.getJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const {
    search, category, jobType, workMode,
    experienceLevel, location, minSalary, maxSalary,
    skills, sort,
  } = req.query;

  const filter = { status: 'active' };

  if (search && search.trim()) filter.$text = { $search: search.trim() };
  if (category)        filter.category        = category;
  if (jobType)         filter.jobType         = jobType;
  if (workMode)        filter.workMode        = workMode;
  if (experienceLevel) filter.experienceLevel = experienceLevel;
  if (location)        filter.location        = { $regex: location, $options: 'i' };

  if (minSalary || maxSalary) {
    filter['salary.isHidden'] = false;
    if (minSalary) filter['salary.min'] = { $gte: Number(minSalary) };
    if (maxSalary) filter['salary.max'] = { $lte: Number(maxSalary) };
  }

  if (skills) {
    const skillArr = skills.split(',').map((s) => s.trim()).filter(Boolean);
    if (skillArr.length) filter.skills = { $in: skillArr };
  }

  filter.$or = [
    { deadline: { $exists: false } },
    { deadline: null },
    { deadline: { $gte: new Date() } },
  ];

  let sortObj = { createdAt: -1 };
  if (sort === 'oldest')  sortObj = { createdAt: 1 };
  if (sort === 'salary')  sortObj = { 'salary.max': -1 };
  if (sort === 'popular') sortObj = { applicationCount: -1 };
  if (search) sortObj = { score: { $meta: 'textScore' }, ...sortObj };

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('employer', 'name avatar employerProfile.companyName employerProfile.logoUrl employerProfile.location')
      .sort(sortObj).skip(skip).limit(limit).lean(),
    Job.countDocuments(filter),
  ]);

  return sendSuccess(res, { jobs, pagination: paginationMeta(total, page, limit) });
});

exports.getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate('employer', 'name avatar employerProfile createdAt');

  if (!job) return sendError(res, 'Job not found', 404);
  if (job.status !== 'active' && req.user?.role !== 'admin' && String(job.employer._id) !== String(req.user?._id)) {
    return sendError(res, 'Job not found', 404);
  }

  Job.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();

  let hasApplied = false;
  let hasSaved   = false;

  if (req.user?.role === 'seeker') {
    const SavedJob = require('../models/SavedJob');
    const [app, saved] = await Promise.all([
      Application.findOne({ job: job._id, applicant: req.user._id }),
      SavedJob.findOne({ job: job._id, user: req.user._id }),
    ]);
    hasApplied = !!app;
    hasSaved   = !!saved;
  }

  return sendSuccess(res, { job, hasApplied, hasSaved });
});

exports.updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return sendError(res, 'Job not found', 404);
  if (String(job.employer) !== String(req.user._id)) return sendError(res, 'Not authorized to edit this job', 403);
  if (job.status === 'closed') return sendError(res, 'Cannot edit a closed job', 400);

  const allowedFields = [
    'title', 'description', 'requirements', 'responsibilities',
    'category', 'jobType', 'workMode', 'experienceLevel',
    'location', 'salary', 'skills', 'deadline', 'openings',
  ];
  allowedFields.forEach((field) => { if (req.body[field] !== undefined) job[field] = req.body[field]; });

  const triggerReview = ['title', 'description', 'requirements'].some((f) => req.body[f]);
  const wasActive     = job.status === 'active';
  if (triggerReview) job.status = 'pending';

  await job.save();

  if (triggerReview && wasActive) {
    await Notification.create({
      recipient: req.user._id,
      type:      'general',
      title:     'Job sent back for review',
      message:   `Your edits to "${job.title}" require admin approval. The listing is temporarily offline until approved.`,
      link:      '/employer/jobs',
      relatedJob: job._id,
    });
  }

  return sendSuccess(res, { job }, 'Job updated');
});

exports.deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return sendError(res, 'Job not found', 404);
  if (String(job.employer) !== String(req.user._id) && req.user.role !== 'admin') return sendError(res, 'Not authorized', 403);
  await Application.deleteMany({ job: job._id });
  await job.deleteOne();
  return sendSuccess(res, {}, 'Job deleted');
});

exports.closeJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return sendError(res, 'Job not found', 404);
  if (String(job.employer) !== String(req.user._id)) return sendError(res, 'Not authorized', 403);
  job.status = 'closed';
  await job.save();
  const applications = await Application.find({ job: job._id }).populate('applicant', 'name');
  const notifications = applications.map((app) => ({
    recipient: app.applicant._id, type: 'job_closed',
    title: 'A job you applied for has been closed',
    message: `The position "${job.title}" has been closed by the employer.`,
    link: `/dashboard/applications`, relatedJob: job._id,
  }));
  if (notifications.length) await Notification.insertMany(notifications);
  return sendSuccess(res, { job }, 'Job closed');
});

exports.getMyJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { employer: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Job.countDocuments(filter),
  ]);
  return sendSuccess(res, { jobs, pagination: paginationMeta(total, page, limit) });
});

exports.getRecommendedJobs = asyncHandler(async (req, res) => {
  const skills = req.user?.seekerProfile?.skills || [];
  const filter = { status: 'active', $or: [{ deadline: null }, { deadline: { $gte: new Date() } }] };
  if (skills.length) filter.skills = { $in: skills };
  const jobs = await Job.find(filter)
    .populate('employer', 'name employerProfile.companyName employerProfile.logoUrl')
    .sort({ createdAt: -1 }).limit(10).lean();
  return sendSuccess(res, { jobs });
});

exports.approveJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('employer', 'name email');
  if (!job) return sendError(res, 'Job not found', 404);
  job.status = 'active';
  await job.save();
  await Notification.create({
    recipient: job.employer._id, type: 'job_approved',
    title: 'Job listing approved!',
    message: `Your job "${job.title}" is now live on HireHub.`,
    link: `/jobs/${job._id}`, relatedJob: job._id,
  });
  try { await sendJobStatusEmail(job.employer.email, { employerName: job.employer.name, jobTitle: job.title, approved: true }); } catch (_) {}
  return sendSuccess(res, { job }, 'Job approved and is now live');
});

exports.rejectJob = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const job = await Job.findById(req.params.id).populate('employer', 'name email');
  if (!job) return sendError(res, 'Job not found', 404);
  job.status = 'rejected';
  await job.save();
  await Notification.create({
    recipient: job.employer._id, type: 'job_rejected',
    title: 'Job listing not approved',
    message: `Your job "${job.title}" was not approved. ${reason || ''}`,
    link: `/employer/jobs`, relatedJob: job._id,
  });
  try { await sendJobStatusEmail(job.employer.email, { employerName: job.employer.name, jobTitle: job.title, approved: false, reason }); } catch (_) {}
  return sendSuccess(res, { job }, 'Job rejected');
});

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Job.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return sendSuccess(res, { categories });
});