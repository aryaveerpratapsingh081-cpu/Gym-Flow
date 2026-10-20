const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Maintenance History:
 * Links to Equipment and records maintenance operations, service costs, and technician notes.
 */
const maintenanceSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true,
    index: true
  },
  serviceDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  technician: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    enum: ['Routine Inspection', 'Repair', 'Parts Replacement', 'Emergency Service', 'Lubrication'],
    default: 'Routine Inspection'
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'In-Progress'],
    default: 'Completed'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
