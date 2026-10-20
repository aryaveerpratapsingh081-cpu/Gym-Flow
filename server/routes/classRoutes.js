const express = require('express');
const router = express.Router();
const {
  getClasses,
  createClass,
  bookClass,
  cancelClassBooking,
  getMemberClassBookings
} = require('../controllers/classController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getClasses);
router.post('/', authorize('Admin', 'Trainer'), createClass);
router.get('/bookings', getMemberClassBookings);
router.post('/:id/book', bookClass);
router.post('/bookings/:id/cancel', cancelClassBooking);

module.exports = router;
