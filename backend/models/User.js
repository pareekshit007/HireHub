const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type:     String,
      minlength: [6, 'Password must be at least 6 characters'],
      select:   false, // never returned by default
    },
    role: {
      type:    String,
      enum:    ['seeker', 'employer', 'admin'],
      default: 'seeker',
    },
    avatar: {
      type: String,
      default: '',
    },

    // ── Auth provider ──────────────────────
    authProvider: {
      type:    String,
      enum:    ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      default: null,
    },

    // ── Email verification / OTP ───────────
    isVerified: {
      type:    Boolean,
      default: false,
    },
    otp: {
      code:      { type: String,  select: false },
      expiresAt: { type: Date,    select: false },
      attempts:  { type: Number,  default: 0, select: false },
    },

    // ── JWT refresh tokens ─────────────────
    refreshTokens: {
      type:   [String],
      select: false,
      default: [],
    },

    // ── Seeker profile ─────────────────────
    seekerProfile: {
      headline:   { type: String, default: '' },
      bio:        { type: String, default: '' },
      location:   { type: String, default: '' },
      phone:      { type: String, default: '' },
      skills:     { type: [String], default: [] },
      experience: [
        {
          title:    String,
          company:  String,
          from:     Date,
          to:       Date,
          current:  { type: Boolean, default: false },
          desc:     String,
        },
      ],
      education: [
        {
          degree:  String,
          school:  String,
          from:    Date,
          to:      Date,
          current: { type: Boolean, default: false },
        },
      ],
      resumeUrl:      { type: String, default: '' },
      resumePublicId: { type: String, default: '' }, // Cloudinary public_id
      portfolioUrl:   { type: String, default: '' },
      linkedinUrl:    { type: String, default: '' },
      githubUrl:      { type: String, default: '' },
    },

    // ── Employer profile ───────────────────
    employerProfile: {
      companyName:    { type: String, default: '' },
      companyWebsite: { type: String, default: '' },
      companySize:    { type: String, default: '' },
      industry:       { type: String, default: '' },
      description:    { type: String, default: '' },
      location:       { type: String, default: '' },
      logoUrl:        { type: String, default: '' },
      logoPublicId:   { type: String, default: '' },
    },

    // ── Account status ─────────────────────
    isActive: {
      type:    Boolean,
      default: true,
    },
    isBanned: {
      type:    Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.otp;
        delete ret.refreshTokens;
        return ret;
      },
    },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ 'otp.expiresAt': 1 }, { expireAfterSeconds: 0 }); // TTL on OTP

// ── Hash password before save ─────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance methods ──────────────────────────────────────────────────────────
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.generateOTP = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    attempts:  0,
  };
  return code;
};

userSchema.methods.clearOTP = function () {
  this.otp = { code: undefined, expiresAt: undefined, attempts: 0 };
};

module.exports = mongoose.model('User', userSchema);
