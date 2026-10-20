const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Member Schema & Relationships:
 * Demonstrates:
 * 1. ObjectId References (linking User, Trainer, and Membership collections)
 * 2. Secondary Indexing (`memberCustomId: 1` and `status: 1`)
 * 3. Cascade/Populate capabilities for entity traversal
 */
const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  memberCustomId: {
    type: String,
    required: true,
    unique: true,
    index: true // e.g. "GF-1001" for QR check-in scanning
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  dob: {
    type: Date
  },
  emergencyContact: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  assignedTrainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    default: null
  },
  currentMembership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership',
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Expiring Soon', 'Pending', 'Cancelled'],
    default: 'Active',
    index: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Member', memberSchema);
