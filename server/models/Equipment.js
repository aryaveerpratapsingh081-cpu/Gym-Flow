const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Equipment & Facility Asset Management:
 * Demonstrates:
 * 1. Categorical asset tracking with maintenance schedule projections
 * 2. Embedded and referenced maintenance records
 * 3. Range querying for 7-day upcoming maintenance alerts
 */
const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true // e.g. "Olympic Barbell Bench Press", "Treadmill Pro-X9", "Cable Crossover Machine"
  },
  category: {
    type: String,
    enum: ['Cardio', 'Strength', 'Free Weights', 'Functional', 'Recovery', 'Machines'],
    default: 'Strength'
  },
  serialNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Needs Maintenance', 'Out of Order'],
    default: 'Good',
    index: true
  },
  location: {
    type: String,
    default: 'Main Floor'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  lastServiceDate: {
    type: Date,
    default: Date.now
  },
  nextServiceDate: {
    type: Date,
    required: true,
    index: true // Key for querying assets due within 7 days
  },
  cost: {
    type: Number,
    default: 0
  },
  maintenanceNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

equipmentSchema.index({ nextServiceDate: 1, condition: 1 });

module.exports = mongoose.model('Equipment', equipmentSchema);
