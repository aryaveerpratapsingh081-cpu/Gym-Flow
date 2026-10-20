const TrainingSession = require('../models/TrainingSession');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const logAudit = require('../utils/auditLogger');

/**
 * DBMS LAB CONCEPT - Personal Training & Temporal Overlap Prevention:
 * Demonstrates:
 * 1. Range overlap detection query using $or and interval inequalities
 * 2. Cross-collection entity referencing (Trainer <-> Member)
 * 3. Schedule conflict management
 */

// @desc    Get training sessions (filtered by role or user)
// @route   GET /api/training-sessions
const getTrainingSessions = async (req, res) => {
  try {
    const { trainerId, memberId, status } = req.query;
    let filter = {};

    if (trainerId) filter.trainer = trainerId;
    if (memberId) filter.member = memberId;
    if (status && status !== 'All') filter.status = status;

    if (req.user.role === 'Trainer') {
      const trainer = await Trainer.findOne({ user: req.user._id });
      if (trainer) filter.trainer = trainer._id;
    } else if (req.user.role === 'Member') {
      const member = await Member.findOne({ user: req.user._id });
      if (member) filter.member = member._id;
    }

    const sessions = await TrainingSession.find(filter)
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name email phone avatar' }
      })
      .sort({ startTime: 1 });

    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Book a 1-on-1 personal training session with overlap prevention
// @route   POST /api/training-sessions
const bookTrainingSession = async (req, res) => {
  try {
    const { trainerId, memberId: providedMemberId, startTime, endTime, title, focusArea, notes } = req.body;

    if (!trainerId || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Trainer, start time, and end time are required' });
    }

    let memberId = providedMemberId;
    if (!memberId) {
      const member = await Member.findOne({ user: req.user._id });
      if (!member) {
        return res.status(404).json({ success: false, message: 'Member record not found' });
      }
      memberId = member._id;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    // CHECK 1: Trainer Overlap Detection Query
    const trainerConflict = await TrainingSession.findOne({
      trainer: trainerId,
      status: 'Scheduled',
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } }
      ]
    });

    if (trainerConflict) {
      return res.status(400).json({
        success: false,
        conflict: true,
        message: 'The selected trainer already has a scheduled session during this time window. Please choose another time slot.'
      });
    }

    // CHECK 2: Member Overlap Detection Query
    const memberConflict = await TrainingSession.findOne({
      member: memberId,
      status: 'Scheduled',
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } }
      ]
    });

    if (memberConflict) {
      return res.status(400).json({
        success: false,
        conflict: true,
        message: 'You already have another training session booked during this time interval.'
      });
    }

    // Create session
    const session = await TrainingSession.create({
      trainer: trainerId,
      member: memberId,
      title: title || '1-on-1 PT Consultation',
      focusArea: focusArea || 'Hypertrophy & Strength',
      startTime: start,
      endTime: end,
      notes: notes || '',
      status: 'Scheduled'
    });

    const populated = await TrainingSession.findById(session._id)
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name' }
      })
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name' }
      });

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name || 'User',
      actorRole: req.user?.role || 'Member',
      action: 'TRAINING_SESSION_BOOKED',
      entity: 'TrainingSession',
      entityId: session._id,
      details: `Booked PT session with trainer for ${start.toLocaleString()}`
    });

    res.status(201).json({
      success: true,
      message: 'Personal training session confirmed!',
      data: populated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update session status (Complete / Cancel)
// @route   PUT /api/training-sessions/:id/status
const updateSessionStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const session = await TrainingSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.status = status;
    if (notes) session.notes = notes;
    await session.save();

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: `TRAINING_SESSION_${status.toUpperCase()}`,
      entity: 'TrainingSession',
      entityId: session._id,
      details: `PT session status updated to ${status}`
    });

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTrainingSessions,
  bookTrainingSession,
  updateSessionStatus
};
