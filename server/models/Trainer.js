const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Trainer Schema:
 * Demonstrates link with User credentials and specialization attributes.
 */
const trainerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  trainerCustomId: {
    type: String,
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: true,
    default: 'General Fitness & Strength'
  },
  experienceYears: {
    type: Number,
    required: true,
    default: 1
  },
  availability: {
    type: String,
    default: 'Morning & Evening (6 AM - 9 PM)'
  },
  bio: {
    type: String,
    default: 'Certified personal trainer dedicated to helping members achieve their fitness goals.'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Trainer', trainerSchema);
