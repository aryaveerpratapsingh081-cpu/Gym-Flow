const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Progress Tracking Schema:
 * Stores body transformation and Personal Records (PR) history.
 * Enables time-series analytics and multi-line charting.
 */
const progressSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer'
  },
  weightKg: {
    type: Number,
    required: true
  },
  bodyFatPercentage: {
    type: Number,
    default: null
  },
  chestCm: {
    type: Number,
    default: null
  },
  waistCm: {
    type: Number,
    default: null
  },
  bicepsCm: {
    type: Number,
    default: null
  },
  benchPressPRKg: {
    type: Number,
    default: null
  },
  squatPRKg: {
    type: Number,
    default: null
  },
  deadliftPRKg: {
    type: Number,
    default: null
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Progress', progressSchema);
