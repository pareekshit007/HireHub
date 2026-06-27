const Application  = require('../models/Application');
const Job          = require('../models/Job');
const User         = require('../models/User');
const { Notification } = require('../models/SavedJob');
const { handleResumeUpload } = require('../middleware/uploadMiddleware');
const { sendApplicationConfirmation, sendNewApplicationAlert, sendStatusUpdateEmail } = require('../utils/emailUtils');
const { sendSuccess, sendError, asyncHandler, getPagination, paginationMeta } = require('../utils/apiHelpers');

exports.applyToJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { coverLetter } = req.body;

  const job = await Job.findById(jobId).populate('employer', 'name email employerProfile');
  if (!job) return sendError(res, 'Job not found', 404);
  if (job.status !== 'active') return sendError(res, 'This job is no longer accepting applications', 400);
  if (job.deadline && new Date() > job.deadline) return sendError(res, 'Application deadline has passed', 400);

  const exists = await Application.findOne({ job: jobId, applicant: req.user._id });
  if (exists) return sendError(res, 'You have already applied to this job', 409);

  const seeker = await User.findById(req.user._id);
  const resumeUrl      = req.uploadedFile?.url      || seeker.seekerProfile?.resumeUrl      || '';
  const resumePublicId = req.uploadedFile?.publicId || seeker.seekerProfile?.resumePublicId || '';
  if (!resumeUrl) return sendError(res, 'Please upload a resume before applying', 400);

  const application = await Application.create({
    job: jobId, applicant: req.user._id, employer: job.employer._id,
    coverLetter, resumeUrl, resumePublicId,
    statusHistory: [{ status: 'pending', note: 'Application submitted' }],
  });

  await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

  await Notification.create({
    recipient: job.employer._id, type: 'application_received',
    title: 'New application received',
    message: `${seeker.name} applied for "${job.title}"`,
    link: `/employer/applications/${application._id}`,
    relatedJob: job._id, relatedApplication: application._id,
  });

  try {
    await Promise.all([
      sendApplicationConfirmation(seeker.email, {
        seekerName: seeker.name, jobTitle: job.title,
        companyName: job.employer.employerProfile?.companyName || job.employer.name,
      }),
      sendNewApplicationAlert(job.employer.email, {
        employerName: job.employer.name, applicantName: seeker.name,
        jobTitle: job.title, applicationId: application._id,
      }),
    ]);
  } catch (_) {}

  return sendSuccess(res, { application }, 'Application submitted successfully', 201);
});

exports.withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) return sendError(res, 'Application not found', 404);
  if (String(application.applicant) !== String(req.user._id)) return sendError(res, 'Not authorized', 403);
  if (['hired', 'rejected'].includes(application.status)) return sendError(res, 'Cannot withdraw a finalized application', 400);
  application.isWithdrawn = true;
  application.status = 'rejected';
  application.statusHistory.push({ status: 'rejected', note: 'Withdrawn by applicant' });
  await application.save();
  await Job.findByIdAndUpdate(application.job, { $inc: { applicationCount: -1 } });
  return sendSuccess(res, {}, 'Application withdrawn');
});

exports.getMyApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { applicant: req.user._id, isWithdrawn: false };
  if (req.query.status) filter.status = req.query.status;
  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate({ path: 'job', select: 'title location jobType workMode salary category status deadline',
        populate: { path: 'employer', select: 'name employerProfile.companyName employerProfile.logoUrl' } })
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
    Application.countDocuments(filter),
  ]);
  return sendSuccess(res, { applications, pagination: paginationMeta(total, page, limit) });
});

exports.getApplicationsForJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { page, limit, skip } = getPagination(req.query);
  const job = await Job.findById(jobId);
  if (!job) return sendError(res, 'Job not found', 404);
  if (String(job.employer) !== String(req.user._id) && req.user.role !== 'admin') return sendError(res, 'Not authorized', 403);
  const filter = { job: jobId };
  if (req.query.status) filter.status = req.query.status;
  const [applications, total] = await Promise.all([
    Application.find(filter).populate('applicant', 'name email avatar seekerProfile')
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
    Application.countDocuments(filter),
  ]);
  return sendSuccess(res, { applications, pagination: paginationMeta(total, page, limit) });
});

exports.getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('applicant', 'name email avatar seekerProfile')
    .populate('job', 'title location jobType category employer')
    .populate('employer', 'name email employerProfile');
  if (!application) return sendError(res, 'Application not found', 404);
  const isApplicant = String(application.applicant._id) === String(req.user._id);
  const isEmployer  = String(application.employer._id)  === String(req.user._id);
  if (!isApplicant && !isEmployer && req.user.role !== 'admin') return sendError(res, 'Not authorized', 403);
  if (isEmployer && !application.seenByEmployer) { application.seenByEmployer = true; await application.save(); }
  return sendSuccess(res, { application });
});

exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!['reviewed', 'shortlisted', 'rejected', 'hired'].includes(status)) return sendError(res, 'Invalid status', 400);
  const application = await Application.findById(req.params.id)
    .populate('applicant', 'name email')
    .populate('job', 'title employer')
    .populate('employer', 'name employerProfile.companyName');
  if (!application) return sendError(res, 'Application not found', 404);
  if (String(application.employer._id) !== String(req.user._id) && req.user.role !== 'admin') return sendError(res, 'Not authorized', 403);
  application.status = status;
  application.statusHistory.push({ status, note: note || '' });
  if (note) application.employerNote = note;
  await application.save();
  const companyName = application.employer.employerProfile?.companyName || application.employer.name;
  await Notification.create({
    recipient: application.applicant._id, type: 'application_status',
    title: `Application ${status}`,
    message: `Your application for "${application.job.title}" at ${companyName} is now: ${status.toUpperCase()}`,
    link: `/dashboard/applications`,
    relatedJob: application.job._id, relatedApplication: application._id,
  });
  try { await sendStatusUpdateEmail(application.applicant.email, { seekerName: application.applicant.name, jobTitle: application.job.title, companyName, status, note }); } catch (_) {}
  return sendSuccess(res, { application }, `Application marked as ${status}`);
});

exports.getAllEmployerApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { employer: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.jobId)  filter.job    = req.query.jobId;
  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('applicant', 'name email avatar seekerProfile.headline seekerProfile.skills')
      .populate('job', 'title location jobType')
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
    Application.countDocuments(filter),
  ]);
  return sendSuccess(res, { applications, pagination: paginationMeta(total, page, limit) });
});