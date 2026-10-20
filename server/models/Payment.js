const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Payment Schema & Financial Modeling:
 * Demonstrates:
 * 1. Financial transaction integrity with unique invoice and transaction tracking
 * 2. Secondary indexing on `paymentDate`, `member`, and `status`
 * 3. Support for discount snapshots, coupon attribution, and refunds
 */
const paymentSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true
  },
  membership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  discountApplied: {
    type: Number,
    default: 0
  },
  couponCode: {
    type: String,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Razorpay', 'NetBanking', 'Wallet'],
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayOrderId: {
    type: String,
    default: null,
    index: true
  },
  razorpayPaymentId: {
    type: String,
    default: null,
    index: true
  },
  razorpaySignature: {
    type: String,
    default: null
  },
  invoiceNo: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['Completed', 'Pending', 'Failed', 'Refunded'],
    default: 'Completed',
    index: true
  },
  isDemoPayment: {
    type: Boolean,
    default: false
  },
  isRefunded: {
    type: Boolean,
    default: false
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

paymentSchema.index({ member: 1, paymentDate: -1 });
paymentSchema.index({ status: 1, paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
