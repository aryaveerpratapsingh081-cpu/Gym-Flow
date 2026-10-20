const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Feedback & Review Aggregation:
 * Demonstrates:
 * 1. Schema Validation (rating min: 1, max: 5)
 * 2. Polymorphic referencing (Trainer, Class, Facility)
 * 3. Aggregation pipelines ($group, $avg, $count) for computing live trainer & gym star ratings
 */
const feedbackSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['Trainer', 'Class', 'Facility', 'General'],
    required: true,
    index: true
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    default: null,
    index: true
  },
  classRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1 star'],
    max: [5, 'Rating cannot exceed 5 stars']
  },
  comment: {
    type: String,
    required: [true, 'Written feedback comment is required'],
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['Approved', 'Pending', 'Rejected'],
    default: 'Approved',
    index: true
  }
}, {
  timestamps: true
});

feedbackSchema.index({ category: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
