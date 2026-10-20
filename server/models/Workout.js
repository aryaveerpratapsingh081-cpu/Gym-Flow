const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Workout Schema & Embedded Document Subschemas:
 * Demonstrates:
 * Embedding sub-documents (`exercises` array inside Workout schema)
 * Embedding vs Referencing: Exercises are embedded within the Workout document because they are tightly coupled and always read together.
 */
const exerciseSubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  muscleGroup: { type: String, required: true },
  sets: { type: Number, required: true, default: 3 },
  reps: { type: Number, required: true, default: 10 },
  weightKg: { type: Number, default: 0 },
  restTimeSec: { type: Number, default: 60 },
  day: { type: String, required: true, default: 'Day 1' },
  notes: { type: String, default: '' },
  completed: { type: Boolean, default: false }
});

const workoutSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
  planName: {
    type: String,
    required: true,
    trim: true
  },
  goal: {
    type: String,
    default: 'General Fitness & Hypertrophy'
  },
  durationWeeks: {
    type: Number,
    default: 4
  },
  exercises: [exerciseSubSchema],
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Archived'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Workout', workoutSchema);
