const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Plan Schema:
 * Defines membership catalog plans (Basic, Silver, Gold, Premium).
 */
const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    unique: true,
    trim: true
  },
  durationMonths: {
    type: Number,
    required: [true, 'Duration in months is required'],
    min: 1
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  features: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Plan', planSchema);
