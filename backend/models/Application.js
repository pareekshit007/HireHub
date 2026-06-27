const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Job',
      required: true,
    },
    applicant: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    employer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // ── Submission ─────────────────────────
    coverLetter: {
      type:    String,
      default: '',
    },
    resumeUrl: {
      type:    String,
      default: '',
    },
    resumePublicId: {
      type:    String,
      default: '',
    },

    // ── Status pipeline ────────────────────
    status: {
      type:    String,
      enum:    ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'],
      default: 'pending',
    },
    statusHistory: [
      {
        status:    { type: String },
        changedAt: { type: Date, default: Date.now },
        note:      { type: String, default: '' },
      },
    ],

    // ── Employer note ──────────────────────
    employerNote: {
      type:    String,
      default: '',
    },

    // ── Seeker flags ───────────────────────
    isWithdrawn: {
      type:    Boolean,
      default: false,
    },
    seenByEmployer: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ employer: 1, status: 1 });
applicationSchema.index({ applicant: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
