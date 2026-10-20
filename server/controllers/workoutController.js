const Workout = require('../models/Workout');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');

/**
 * DBMS LAB CONCEPT - Workout Controller:
 * Handles workout assignment using Embedded Exercise Documents inside MongoDB.
 */

/**
 * @desc    Create or update workout plan for a member
 * @route   POST /api/workouts
 * @access  Private (Trainer, Admin)
 */
const createOrUpdateWorkout = async (req, res) => {
  try {
    const { memberId, planName, goal, durationWeeks, exercises } = req.body;

    if (!memberId || !planName || !exercises) {
      return res.status(400).json({ success: false, message: 'Member, plan name, and exercises are required' });
    }

    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    // Determine trainer ID
    let trainerId = member.assignedTrainer;
    if (!trainerId && req.user.role === 'Trainer') {
      const trainer = await Trainer.findOne({ user: req.user._id });
      if (trainer) trainerId = trainer._id;
    }

    // Deactivate previous active workouts for this member
    await Workout.updateMany(
      { member: memberId, status: 'Active' },
      { $set: { status: 'Archived' } }
    );

    const workout = await Workout.create({
      member: memberId,
      trainer: trainerId || null,
      planName,
      goal: goal || 'Strength & Fitness',
      durationWeeks: durationWeeks || 4,
      exercises,
      status: 'Active'
    });

    const populatedWorkout = await Workout.findById(workout._id)
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name email' }
      });

    res.status(201).json({ success: true, data: populatedWorkout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get active workout for member
 * @route   GET /api/workouts/member/:memberId
 * @access  Private
 */
const getMemberWorkout = async (req, res) => {
  try {
    const { memberId } = req.params;

    const workout = await Workout.findOne({ member: memberId, status: 'Active' })
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name phone' }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: workout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all workouts (Trainer / Admin view)
 * @route   GET /api/workouts
 * @access  Private (Trainer, Admin)
 */
const getAllWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find()
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name email' }
      })
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name' }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: workouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete workout plan
 * @route   DELETE /api/workouts/:id
 * @access  Private (Trainer, Admin)
 */
const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findByIdAndDelete(req.params.id);
    if (!workout) return res.status(404).json({ success: false, message: 'Workout not found' });
    res.json({ success: true, message: 'Workout plan deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrUpdateWorkout,
  getMemberWorkout,
  getAllWorkouts,
  deleteWorkout
};
