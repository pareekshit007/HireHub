const multer      = require('multer');
const streamifier = require('streamifier');
const cloudinary  = require('../config/cloudinary');
const { sendError } = require('../utils/apiHelpers');

// Use memory storage — stream directly to Cloudinary (no temp files on Render)
const storage = multer.memoryStorage();

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`), false);
  }
};

// Resume upload — PDF only, 5 MB max
const resumeUpload = multer({
  storage,
  limits:     { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(['application/pdf']),
}).single('resume');

// Logo upload — images only, 2 MB max
const logoUpload = multer({
  storage,
  limits:     { fileSize: 2 * 1024 * 1024 },
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
}).single('logo');

// Avatar upload — images only, 2 MB max
const avatarUpload = multer({
  storage,
  limits:     { fileSize: 2 * 1024 * 1024 },
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
}).single('avatar');

/**
 * streamUploadToCloudinary — upload buffer to Cloudinary
 * Returns the Cloudinary upload result
 */
const streamUploadToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });

/**
 * handleResumeUpload — middleware: multer → Cloudinary
 */
const handleResumeUpload = async (req, res, next) => {
  resumeUpload(req, res, async (err) => {
    if (err) return sendError(res, err.message, 400);
    if (!req.file) return next(); // no file attached — fine for updates

    try {
      const result = await streamUploadToCloudinary(req.file.buffer, {
        folder:        'hirehub/resumes',
        resource_type: 'raw',
        format:        'pdf',
        public_id:     `resume_${req.user._id}_${Date.now()}`,
      });
      req.uploadedFile = {
        url:      result.secure_url,
        publicId: result.public_id,
      };
      next();
    } catch (uploadErr) {
      return sendError(res, 'File upload failed', 500);
    }
  });
};

/**
 * handleLogoUpload — middleware: multer → Cloudinary
 */
const handleLogoUpload = async (req, res, next) => {
  logoUpload(req, res, async (err) => {
    if (err) return sendError(res, err.message, 400);
    if (!req.file) return next();

    try {
      const result = await streamUploadToCloudinary(req.file.buffer, {
        folder:         'hirehub/logos',
        transformation: [{ width: 400, height: 400, crop: 'limit' }],
        public_id:      `logo_${req.user._id}_${Date.now()}`,
      });
      req.uploadedFile = {
        url:      result.secure_url,
        publicId: result.public_id,
      };
      next();
    } catch (uploadErr) {
      return sendError(res, 'Logo upload failed', 500);
    }
  });
};

/**
 * deleteFromCloudinary — delete a file by public_id
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

module.exports = {
  handleResumeUpload,
  handleLogoUpload,
  streamUploadToCloudinary,
  deleteFromCloudinary,
};
