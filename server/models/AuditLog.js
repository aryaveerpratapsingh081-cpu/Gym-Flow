const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Audit Trail & System Logging:
 * Demonstrates:
 * 1. Immutable audit record storage for critical system state mutations
 * 2. Actor reference (User ID or system process)
 * 3. Entity reference and delta change tracking (oldValue vs newValue)
 * 4. Compound Indexing on entity + timestamp for rapid compliance auditing
 */
const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  actorName: {
    type: String,
    default: 'System'
  },
  actorRole: {
    type: String,
    enum: ['Admin', 'Trainer', 'Member', 'System'],
    default: 'System'
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    index: true // e.g., 'MEMBER_STATUS_CHANGE', 'MEMBERSHIP_FROZEN', 'PAYMENT_RECEIVED', 'LOCKER_ALLOCATED'
  },
  entity: {
    type: String,
    required: [true, 'Entity name is required'],
    index: true // e.g., 'Member', 'Membership', 'Payment', 'Locker', 'ClassBooking'
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  oldValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  details: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  }
}, {
  timestamps: true
});

auditLogSchema.index({ entity: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
