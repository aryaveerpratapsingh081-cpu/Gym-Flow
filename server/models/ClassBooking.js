const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Class Booking & Compound Unique Index:
 * Demonstrates:
 * 1. Compound Unique Index `{ class: 1, member: 1 }` to prevent duplicate bookings at DB level
 * 2. Status lifecycle ('Booked', 'Cancelled', 'Attended')
 */
const classBookingSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Booked', 'Cancelled', 'Attended'],
    default: 'Booked'
  },
  bookedAt: {
    type: Date,
    default: Date.now
  },
  cancelledAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Prevent duplicate active bookings for the same member on the same class
classBookingSchema.index({ class: 1, member: 1 }, { unique: true });

module.exports = mongoose.model('ClassBooking', classBookingSchema);
