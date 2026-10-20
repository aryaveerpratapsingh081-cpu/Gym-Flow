const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPayments,
  refundPayment,
  deletePayment
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', authorize('Admin'), createPayment);
router.get('/', getPayments);
router.post('/:id/refund', authorize('Admin'), refundPayment);
router.delete('/:id', authorize('Admin'), deletePayment);

module.exports = router;
