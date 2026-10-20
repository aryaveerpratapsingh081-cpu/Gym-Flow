const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Notification Schema:
 * Handles real-time system alerts (e.g. expiring memberships, payment receipts).
 */
const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'alert'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d' // TTL index: auto purge notifications after 30 days
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
