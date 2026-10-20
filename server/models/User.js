const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * DBMS LAB CONCEPT - User Schema:
 * Demonstrates:
 * 1. Schema Validation (required, enum, unique)
 * 2. Indexes (`email: 1` for fast O(1) authentication lookups)
 * 3. Pre-save Middleware (Hashing password using bcryptjs before document insertion)
 * 4. Document Methods (Encapsulated password verification)
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true // Indexing for quick authentication queries
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Trainer', 'Member'],
    default: 'Member',
    required: true
  },
  avatar: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Pre-save hook to hash password automatically before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare input password with stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
