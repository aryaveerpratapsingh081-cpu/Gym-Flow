const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getTrainerDashboard,
  getMemberDashboard
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/admin', authorize('Admin'), getAdminDashboard);
router.get('/trainer', authorize('Trainer'), getTrainerDashboard);
router.get('/member', authorize('Member'), getMemberDashboard);

module.exports = router;
