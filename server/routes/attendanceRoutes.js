const express = require('express');
const router = express.Router();
const {
  markCheckIn,
  markCheckOut,
  getAttendance,
  getMemberAttendanceStats,
  generateCheckInToken,
  verifyCheckInToken
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// TTL QR Token routes
router.post('/token/generate', generateCheckInToken);
router.post('/token/verify', authorize('Admin', 'Trainer'), verifyCheckInToken);

// Standard Attendance check-in / check-out
router.post('/check-in', authorize('Admin', 'Trainer'), markCheckIn);
router.put('/:id/check-out', authorize('Admin', 'Trainer'), markCheckOut);
router.get('/', getAttendance);
router.get('/member/:memberId', getMemberAttendanceStats);

module.exports = router;
