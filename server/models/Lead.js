const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Leads & Prospect Pipeline:
 * Demonstrates:
 * 1. Embedded follow-up interaction history
 * 2. Status state transitions: 'New' -> 'Contacted' -> 'Trial Active' -> 'Converted' / 'Lost'
 * 3. Conversion tracking to registered Member entity
 */
const followUpSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  notes: { type: String, required: true },
  contactedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const leadSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Prospect name is required'],
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    index: true
  },
  interest: {
    type: String,
    enum: ['Weight Loss', 'Bodybuilding', 'CrossFit', 'Yoga & Wellness', 'General Fitness', 'Personal Training'],
    default: 'General Fitness'
  },
  source: {
    type: String,
    enum: ['Walk-in', 'Website', 'Instagram', 'Referral', 'Google Search', 'Other'],
    default: 'Website'
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Trial Active', 'Converted', 'Lost'],
    default: 'New',
    index: true
  },
  hasTrialPass: {
    type: Boolean,
    default: true
  },
  trialPassDurationDays: {
    type: Number,
    default: 3
  },
  trialStartDate: {
    type: Date,
    default: null
  },
  trialEndDate: {
    type: Date,
    default: null
  },
  convertedMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    default: null
  },
  followUps: [followUpSchema],
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);
