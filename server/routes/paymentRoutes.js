const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPayments,
  refundPayment,
  deletePayment
} = require('../controllers/paymentController');
const {
  getRazorpayKey,
  createRazorpayOrder,
  verifyRazorpayPayment
} = require('../controllers/razorpayController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public / Registration Razorpay Endpoints
router.get('/razorpay-key', getRazorpayKey);
router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);

// Protected Payment Records (Requires Authentication)
router.use(protect);

router.post('/', authorize('Admin'), createPayment);
router.get('/', getPayments);
router.post('/:id/refund', authorize('Admin'), refundPayment);
router.delete('/:id', authorize('Admin'), deletePayment);

module.exports = router;
