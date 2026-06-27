const express = require('express');
const router  = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const adminOnly = [protect, authorize('admin')];

router.post('/setup', adminController.setupAdmin);
router.get('/stats', ...adminOnly, adminController.getStats);
router.get('/users', ...adminOnly, adminController.getUsers);
router.get('/users/:id', ...adminOnly, adminController.getUserDetail);
router.put('/users/:id/ban', ...adminOnly, adminController.toggleBan);
router.delete('/users/:id', ...adminOnly, adminController.deleteUser);
router.get('/jobs', ...adminOnly, adminController.getJobs);

module.exports = router;