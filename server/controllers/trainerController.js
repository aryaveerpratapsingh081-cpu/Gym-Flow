const Trainer = require('../models/Trainer');
const User = require('../models/User');
const Member = require('../models/Member');

/**
 * DBMS LAB CONCEPT - Trainer Controller & Member Count Aggregation:
 * Demonstrates:
 * 1. Trainer CRUD
 * 2. MongoDB Aggregation ($lookup & $group) to dynamically compute assigned members count per trainer.
 */

/**
 * @desc    Get all trainers with assigned members count
 * @route   GET /api/trainers
 * @access  Private
 */
const getTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find()
      .populate('user', 'name email phone avatar')
      .sort({ createdAt: -1 });

    // DBMS LAB AGGREGATION: Calculate assigned member counts in a single aggregation pipeline
    const memberCountsAgg = await Member.aggregate([
      { $match: { assignedTrainer: { $ne: null } } },
      { $group: { _id: '$assignedTrainer', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    memberCountsAgg.forEach(item => {
      countMap[item._id.toString()] = item.count;
    });

    const trainersWithStats = trainers.map(trainer => ({
      ...trainer.toObject(),
      assignedMembersCount: countMap[trainer._id.toString()] || 0
    }));

    res.json({ success: true, data: trainersWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get trainer details + assigned members list
 * @route   GET /api/trainers/:id
 * @access  Private
 */
const getTrainerById = async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id).populate('user', 'name email phone avatar');

    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    const assignedMembers = await Member.find({ assignedTrainer: trainer._id })
      .populate('user', 'name email phone')
      .populate({
        path: 'currentMembership',
        populate: { path: 'plan', select: 'name' }
      });

    res.json({
      success: true,
      data: {
        trainer,
        assignedMembers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create trainer (Admin)
 * @route   POST /api/trainers
 * @access  Private (Admin)
 */
const createTrainer = async (req, res) => {
  try {
    const { name, email, password, phone, specialization, experienceYears, availability, bio } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: password || 'Trainer@123',
      phone: phone || '',
      role: 'Trainer'
    });

    const count = await Trainer.countDocuments();
    const trainerCustomId = `TR-${101 + count}`;

    const trainer = await Trainer.create({
      user: user._id,
      trainerCustomId,
      specialization: specialization || 'General Fitness',
      experienceYears: experienceYears || 1,
      availability: availability || '6:00 AM - 9:00 PM',
      bio: bio || ''
    });

    const populatedTrainer = await Trainer.findById(trainer._id).populate('user', 'name email phone');

    res.status(201).json({ success: true, data: populatedTrainer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update trainer details
 * @route   PUT /api/trainers/:id
 * @access  Private (Admin)
 */
const updateTrainer = async (req, res) => {
  try {
    const { name, phone, specialization, experienceYears, availability, bio, status } = req.body;

    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    if (name || phone) {
      await User.findByIdAndUpdate(trainer.user, {
        ...(name && { name }),
        ...(phone && { phone })
      });
    }

    trainer.specialization = specialization || trainer.specialization;
    trainer.experienceYears = experienceYears !== undefined ? experienceYears : trainer.experienceYears;
    trainer.availability = availability || trainer.availability;
    trainer.bio = bio !== undefined ? bio : trainer.bio;
    trainer.status = status || trainer.status;

    await trainer.save();

    const updatedTrainer = await Trainer.findById(trainer._id).populate('user', 'name email phone');

    res.json({ success: true, data: updatedTrainer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete trainer & unassign members
 * @route   DELETE /api/trainers/:id
 * @access  Private (Admin)
 */
const deleteTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    // Unassign members assigned to this trainer
    await Member.updateMany(
      { assignedTrainer: trainer._id },
      { $set: { assignedTrainer: null } }
    );

    await User.findByIdAndDelete(trainer.user);
    await Trainer.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Trainer deleted successfully and members unassigned' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  deleteTrainer
};
