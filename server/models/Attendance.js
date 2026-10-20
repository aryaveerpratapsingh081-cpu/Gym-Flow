const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Attendance Schema & Compound Unique Index:
 * Demonstrates:
 * 1. Compound Index: `{ member: 1, date: 1 }` with `unique: true`
 *    Ensures a member cannot have duplicate attendance records on the exact same calendar date at database level!
 * 2. Rapid aggregation query support for daily check-in reports.
 */
const attendanceSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true
  },
  checkInTime: {
    type: String, // Format: e.g. "08:30 AM"
    required: true
  },
  checkOutTime: {
    type: String, // Format: e.g. "10:15 AM"
    default: null
  },
  status: {
    type: String,
    enum: ['Present', 'Late', 'Absent'],
    default: 'Present'
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Enforce single check-in per member per date at database level
attendanceSchema.index({ member: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
