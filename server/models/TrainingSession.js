const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Personal Training Sessions & Temporal Constraints:
 * Demonstrates:
 * 1. Multi-party references: Member and Trainer
 * 2. Range validation and overlapping session prevention queries
 */
const trainingSessionSchema = new mongoose.Schema({
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true,
    index: true
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: '1-on-1 Personal Training'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  focusArea: {
    type: String,
    default: 'General Conditioning'
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'No-Show'],
    default: 'Scheduled',
    index: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

trainingSessionSchema.index({ trainer: 1, startTime: 1 });
trainingSessionSchema.index({ member: 1, startTime: 1 });

module.exports = mongoose.model('TrainingSession', trainingSessionSchema);
