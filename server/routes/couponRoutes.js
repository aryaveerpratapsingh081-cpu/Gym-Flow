const express = require('express');
const router = express.Router();
const {
  getCoupons,
  createCoupon,
  validateCoupon
} = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route to validate coupon during registration/checkout
router.post('/validate', validateCoupon);

router.use(protect);

router.get('/', getCoupons);
router.post('/', authorize('Admin'), createCoupon);

module.exports = router;
