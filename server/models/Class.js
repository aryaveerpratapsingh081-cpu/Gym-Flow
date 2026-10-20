const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Group Classes & Concurrency Handling:
 * Demonstrates:
 * 1. Embedded scheduling & capacity boundaries
 * 2. Trainer reference relationship
 * 3. Atomic capacity management ($inc with condition { bookedCount: { $lt: capacity } })
 */
const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true // e.g. "Morning Power Yoga", "Zumba Dance Fitness", "HIIT Spin Session"
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
  category: {
    type: String,
    enum: ['Yoga', 'Zumba', 'Spin', 'CrossFit', 'Pilates', 'HIIT', 'Boxing'],
    default: 'Yoga'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  durationMinutes: {
    type: Number,
    default: 60
  },
  capacity: {
    type: Number,
    required: [true, 'Class capacity is required'],
    min: 1
  },
  bookedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  location: {
    type: String,
    default: 'Studio A'
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In-Progress', 'Completed', 'Cancelled'],
    default: 'Scheduled',
    index: true
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

classSchema.index({ startTime: 1, trainer: 1 });

module.exports = mongoose.model('Class', classSchema);
