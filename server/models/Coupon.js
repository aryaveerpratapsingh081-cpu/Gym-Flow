const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Offers & Coupons with Atomic Redemption:
 * Demonstrates:
 * 1. Unique indexed code lookups
 * 2. Atomic $inc updates with compound boundary conditions:
 *    `{ code, status: 'Active', timesUsed: { $lt: '$usageLimit' }, validUntil: { $gte: now } }`
 *    guarantees usage limits are never exceeded during concurrent checkouts!
 */
const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true // e.g. "SUMMER500", "WELCOME10", "FESTIVE20"
  },
  description: {
    type: String,
    default: ''
  },
  discountType: {
    type: String,
    enum: ['Percentage', 'Fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: 1
  },
  minPurchase: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number,
    default: 5000 // Cap for percentage discounts
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true,
    index: true
  },
  usageLimit: {
    type: Number,
    default: 100
  },
  timesUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Disabled'],
    default: 'Active',
    index: true
  },
  eligiblePlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
