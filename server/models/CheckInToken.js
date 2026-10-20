const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - TTL Index (Time-To-Live Index) & Replay Prevention:
 * Demonstrates:
 * 1. MongoDB TTL Index on `expiresAt`: MongoDB background thread automatically purges documents
 *    after they expire.
 * 2. Replay Prevention: `isUsed: true` ensures every QR token is strictly single-use.
 * 3. Exact Server-Side Timestamp Validation: Because MongoDB TTL cleanup runs periodically (every 60s),
 *    the server must strictly check `Date.now() > expiresAt` on verification!
 */
const checkInTokenSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false,
    index: true
  },
  usedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// MongoDB TTL Index: automatically purges document when expiresAt timestamp passes
checkInTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('CheckInToken', checkInTokenSchema);
