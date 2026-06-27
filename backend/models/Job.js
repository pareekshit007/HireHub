const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'Job title is required'],
      trim:      true,
      maxlength: [150, 'Title too long'],
    },
    description: {
      type:     String,
      required: [true, 'Description is required'],
    },
    requirements: {
      type:    String,
      default: '',
    },
    responsibilities: {
      type:    String,
      default: '',
    },

    // ── Employer ───────────────────────────
    employer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // ── Classification ─────────────────────
    category: {
      type:     String,
      required: [true, 'Category is required'],
      enum: [
        'Technology', 'Finance', 'Healthcare', 'Education', 'Marketing',
        'Design', 'Sales', 'Operations', 'HR', 'Legal', 'Engineering',
        'Customer Support', 'Data Science', 'Product', 'Other',
      ],
    },
    jobType: {
      type:    String,
      enum:    ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
      default: 'Full-time',
    },
    workMode: {
      type:    String,
      enum:    ['On-site', 'Remote', 'Hybrid'],
      default: 'On-site',
    },
    experienceLevel: {
      type:    String,
      enum:    ['Entry', 'Mid', 'Senior', 'Lead', 'Executive'],
      default: 'Mid',
    },

    // ── Location & Salary ──────────────────
    location: {
      type:    String,
      default: 'Remote',
    },
    salary: {
      min:      { type: Number, default: 0 },
      max:      { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      isHidden: { type: Boolean, default: false },
    },

    // ── Skills ─────────────────────────────
    skills: {
      type:    [String],
      default: [],
    },

    // ── Status & Visibility ────────────────
    status: {
      type:    String,
      enum:    ['pending', 'active', 'closed', 'rejected'],
      default: 'pending', // admin must approve
    },
    deadline: {
      type: Date,
    },
    openings: {
      type:    Number,
      default: 1,
      min:     1,
    },

    // ── Stats ──────────────────────────────
    views: {
      type:    Number,
      default: 0,
    },
    applicationCount: {
      type:    Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
jobSchema.index({ title: 'text', description: 'text', skills: 'text' }); // full-text search
jobSchema.index({ employer: 1, status: 1 });
jobSchema.index({ status: 1, category: 1, jobType: 1, workMode: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);
