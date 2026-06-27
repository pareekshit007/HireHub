const mongoose = require('mongoose');

// ── SavedJob ──────────────────────────────────────────────────────────────────
const savedJobSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    job: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Job',
      required: true,
    },
  },
  { timestamps: true }
);

savedJobSchema.index({ user: 1, job: 1 }, { unique: true });
savedJobSchema.index({ user: 1, createdAt: -1 });

const SavedJob = mongoose.model('SavedJob', savedJobSchema);

// ── Notification ──────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'application_received',   // employer: new application
        'application_status',     // seeker: status changed
        'job_approved',           // employer: job approved by admin
        'job_rejected',           // employer: job rejected by admin
        'job_closed',             // seeker: applied job closed
        'account_verified',       // seeker/employer: email verified
        'new_job_match',          // seeker: new job matches skills
        'general',
      ],
      required: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    link:    { type: String, default: '' },   // frontend route to navigate to
    isRead:  { type: Boolean, default: false },

    // Optional reference IDs
    relatedJob:         { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
    relatedApplication: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { SavedJob, Notification };
