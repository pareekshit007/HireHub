const express = require('express');
const router  = express.Router();
const appController = require('../controllers/applicationController');
const { protect, requireVerified, authorize } = require('../middleware/authMiddleware');
const { handleResumeUpload } = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.post('/:jobId', protect, requireVerified, authorize('seeker'), uploadLimiter, handleResumeUpload, appController.applyToJob);
router.get('/my', protect, authorize('seeker'), appController.getMyApplications);
router.delete('/:id/withdraw', protect, authorize('seeker'), appController.withdrawApplication);
router.get('/employer/all', protect, authorize('employer'), appController.getAllEmployerApplications);
router.get('/job/:jobId', protect, authorize('employer', 'admin'), appController.getApplicationsForJob);
router.put('/:id/status', protect, authorize('employer', 'admin'), appController.updateApplicationStatus);
router.get('/:id', protect, appController.getApplicationById);

module.exports = router;