const Progress = require('../models/Progress');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');

/**
 * DBMS LAB CONCEPT - Progress Controller:
 * Manages member body metric history & strength PR benchmarks.
 */

/**
 * @desc    Record new member progress entry
 * @route   POST /api/progress
 * @access  Private (Trainer, Admin)
 */
const addProgress = async (req, res) => {
  try {
    const {
      memberId,
      weightKg,
      bodyFatPercentage,
      chestCm,
      waistCm,
      bicepsCm,
      benchPressPRKg,
      squatPRKg,
      deadliftPRKg,
      date,
      notes
    } = req.body;

    if (!memberId || weightKg === undefined) {
      return res.status(400).json({ success: false, message: 'Member ID and weight are required' });
    }

    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    let trainerId = member.assignedTrainer;
    if (!trainerId && req.user.role === 'Trainer') {
      const trainer = await Trainer.findOne({ user: req.user._id });
      if (trainer) trainerId = trainer._id;
    }

    const progress = await Progress.create({
      member: memberId,
      trainer: trainerId || null,
      weightKg: Number(weightKg),
      bodyFatPercentage: bodyFatPercentage ? Number(bodyFatPercentage) : null,
      chestCm: chestCm ? Number(chestCm) : null,
      waistCm: waistCm ? Number(waistCm) : null,
      bicepsCm: bicepsCm ? Number(bicepsCm) : null,
      benchPressPRKg: benchPressPRKg ? Number(benchPressPRKg) : null,
      squatPRKg: squatPRKg ? Number(squatPRKg) : null,
      deadliftPRKg: deadliftPRKg ? Number(deadliftPRKg) : null,
      date: date ? new Date(date) : new Date(),
      notes: notes || ''
    });

    res.status(201).json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get progress history & chart data for member
 * @route   GET /api/progress/member/:memberId
 * @access  Private
 */
const getMemberProgress = async (req, res) => {
  try {
    const { memberId } = req.params;

    const progressRecords = await Progress.find({ member: memberId })
      .sort({ date: 1 }); // chronological order for charts

    // Extract latest progress stats
    const latest = progressRecords.length > 0 ? progressRecords[progressRecords.length - 1] : null;

    res.json({
      success: true,
      data: progressRecords,
      latest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete progress record
 * @route   DELETE /api/progress/:id
 * @access  Private (Trainer, Admin)
 */
const deleteProgress = async (req, res) => {
  try {
    const progress = await Progress.findByIdAndDelete(req.params.id);
    if (!progress) return res.status(404).json({ success: false, message: 'Progress record not found' });
    res.json({ success: true, message: 'Progress record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addProgress,
  getMemberProgress,
  deleteProgress
};
