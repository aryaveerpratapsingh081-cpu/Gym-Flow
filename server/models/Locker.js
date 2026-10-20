const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Locker Allocation & Concurrency-Safe Updates:
 * Demonstrates:
 * 1. Locker state machine: 'Available' <-> 'Allocated' <-> 'Under Maintenance'
 * 2. Atomic findOneAndUpdate check: `{ _id, status: 'Available' }` ensures zero double-allocations!
 * 3. Member references and temporal release management
 */
const lockerSchema = new mongoose.Schema({
  lockerNumber: {
    type: String,
    required: [true, 'Locker number is required'],
    unique: true,
    index: true // e.g. "L-101", "L-102"
  },
  zone: {
    type: String,
    enum: ['Ground Floor A', 'Ground Floor B', 'First Floor Men', 'First Floor Women', 'VIP Lounge'],
    default: 'Ground Floor A'
  },
  status: {
    type: String,
    enum: ['Available', 'Allocated', 'Under Maintenance'],
    default: 'Available',
    index: true
  },
  assignedMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    default: null,
    index: true
  },
  allocationDate: {
    type: Date,
    default: null
  },
  releaseDate: {
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

module.exports = mongoose.model('Locker', lockerSchema);
