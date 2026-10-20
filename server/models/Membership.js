const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Membership Schema with Snapshot Integrity & Lifecycle State Machine:
 * Demonstrates:
 * 1. Price & Duration Snapshots: Guarantees historical transactions retain their purchased price/duration
 *    even if the admin changes catalog plans later!
 * 2. Status State Machine ('Active', 'Expiring Soon', 'Expired', 'Frozen', 'Cancelled', 'Pending Payment')
 * 3. Temporal calculations & freeze tracking
 * 4. Compound Indexing on member and status
 */
const freezeRecordSchema = new mongoose.Schema({
  freezeDate: { type: Date, default: Date.now },
  resumeDate: { type: Date, default: null },
  daysFrozen: { type: Number, default: 0 },
  reason: { type: String, default: 'Medical / Travel' }
});

const membershipSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  priceSnapshot: {
    type: Number,
    required: true,
    min: 0
  },
  durationMonthsSnapshot: {
    type: Number,
    required: true,
    min: 1
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  originalEndDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Expiring Soon', 'Frozen', 'Cancelled', 'Pending Payment'],
    default: 'Pending Payment',
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Partial', 'Pending', 'Refunded'],
    default: 'Pending',
    index: true
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  outstandingDues: {
    type: Number,
    default: 0
  },
  isFrozen: {
    type: Boolean,
    default: false
  },
  freezeHistory: [freezeRecordSchema],
  autoRenew: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Helper virtual to calculate remaining days dynamically
membershipSchema.virtual('remainingDays').get(function() {
  if (this.status === 'Frozen') return 0;
  const now = new Date();
  const diffTime = new Date(this.endDate) - now;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

membershipSchema.index({ member: 1, status: 1 });
membershipSchema.index({ endDate: 1, status: 1 });

module.exports = mongoose.model('Membership', membershipSchema);
