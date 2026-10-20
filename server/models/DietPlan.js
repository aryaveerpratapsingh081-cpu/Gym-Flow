const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Embedded Subdocuments & Nested Schemas:
 * Demonstrates:
 * 1. Embedded meal items within diet plans (denormalized for high read performance)
 * 2. Cross-collection references: Member and Trainer
 * 3. Atomic subdocument updates and goal tracking
 */
const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: String, required: true }, // e.g. "4 egg whites + 2 whole wheat toasts"
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 }
});

const mealSchema = new mongoose.Schema({
  mealName: {
    type: String,
    required: true // e.g. "Breakfast", "Mid-Morning", "Lunch", "Pre-Workout", "Dinner"
  },
  mealTime: {
    type: String,
    required: true // e.g. "08:00 AM"
  },
  foodItems: [foodItemSchema],
  calories: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  }
});

const dietPlanSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true // e.g. "Lean Muscle Hypertrophy Nutrition 2500 kcal"
  },
  fitnessGoal: {
    type: String,
    enum: ['Weight Loss', 'Muscle Gain', 'Lean Bulk', 'Endurance', 'Maintenance', 'General Health'],
    default: 'Muscle Gain'
  },
  targetDailyCalories: {
    type: Number,
    required: true
  },
  targetProteinGrams: {
    type: Number,
    default: 150
  },
  targetCarbsGrams: {
    type: Number,
    default: 250
  },
  targetFatsGrams: {
    type: Number,
    default: 60
  },
  waterIntakeLiters: {
    type: Number,
    default: 3.5
  },
  meals: [mealSchema],
  status: {
    type: String,
    enum: ['Active', 'Archived'],
    default: 'Active',
    index: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DietPlan', dietPlanSchema);
