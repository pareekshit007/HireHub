const express = require('express');
const { body } = require('express-validator');
const { validationResult } = require('express-validator');
const router  = express.Router();
const jobController = require('../controllers/jobController');
const { protect, requireVerified, authorize, optionalAuth } = require('../middleware/authMiddleware');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array().map((e) => ({ field: e.path, message: e.msg })) });
  next();
};

const jobValidation = [
  body('title').trim().notEmpty().withMessage('Job title is required').isLength({ max: 150 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ min: 50 }).withMessage('Description must be at least 50 characters'),
  body('category').notEmpty().withMessage('Category is required').isIn(['Technology','Finance','Healthcare','Education','Marketing','Design','Sales','Operations','HR','Legal','Engineering','Customer Support','Data Science','Product','Other']),
  body('jobType').optional().isIn(['Full-time','Part-time','Contract','Internship','Freelance']),
  body('workMode').optional().isIn(['On-site','Remote','Hybrid']),
  body('experienceLevel').optional().isIn(['Entry','Mid','Senior','Lead','Executive']),
  body('skills').optional().isArray(),
  body('openings').optional().isInt({ min: 1 }),
  body('salary.min').optional().isNumeric(),
  body('salary.max').optional().isNumeric(),
  body('deadline').optional().isISO8601(),
];

router.get('/', optionalAuth, jobController.getJobs);
router.get('/categories', jobController.getCategories);
router.get('/recommended', protect, authorize('seeker'), jobController.getRecommendedJobs);
router.get('/employer/my-jobs', protect, authorize('employer'), jobController.getMyJobs);

router.post('/', protect, requireVerified, authorize('employer'), jobValidation, validate, jobController.createJob);
router.put('/:id', protect, requireVerified, authorize('employer'), jobController.updateJob);
router.delete('/:id', protect, authorize('employer', 'admin'), jobController.deleteJob);
router.put('/:id/close', protect, authorize('employer'), jobController.closeJob);
router.put('/:id/approve', protect, authorize('admin'), jobController.approveJob);
router.put('/:id/reject', protect, authorize('admin'), jobController.rejectJob);
router.get('/:id', optionalAuth, jobController.getJobById);

module.exports = router;