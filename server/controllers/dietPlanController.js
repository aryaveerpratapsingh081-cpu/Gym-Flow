const DietPlan = require('../models/DietPlan');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const logAudit = require('../utils/auditLogger');

/**
 * DBMS LAB CONCEPT - Diet & Nutrition with Embedded Subdocuments:
 * Demonstrates:
 * 1. Embedded schema arrays for meals and food items
 * 2. Cross-collection relationships (Member & Trainer)
 * 3. Atomic subdocument editing and macro goal tracking
 */

// @desc    Get diet plans (filtered by member or trainer)
// @route   GET /api/diet-plans
const getDietPlans = async (req, res) => {
  try {
    const { memberId, trainerId } = req.query;
    let filter = { status: 'Active' };

    if (memberId) filter.member = memberId;
    if (trainerId) filter.trainer = trainerId;

    if (req.user.role === 'Member') {
      const member = await Member.findOne({ user: req.user._id });
      if (member) filter.member = member._id;
    } else if (req.user.role === 'Trainer') {
      const trainer = await Trainer.findOne({ user: req.user._id });
      if (trainer) filter.trainer = trainer._id;
    }

    const plans = await DietPlan.find(filter)
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name email phone avatar' }
      })
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name email phone' }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create and assign diet plan to member
// @route   POST /api/diet-plans
const createDietPlan = async (req, res) => {
  try {
    const {
      memberId,
      trainerId: providedTrainerId,
      title,
      fitnessGoal,
      targetDailyCalories,
      targetProteinGrams,
      targetCarbsGrams,
      targetFatsGrams,
      waterIntakeLiters,
      meals,
      notes
    } = req.body;

    if (!memberId || !title || !targetDailyCalories) {
      return res.status(400).json({ success: false, message: 'Member, title, and daily calorie target are required' });
    }

    let trainerId = providedTrainerId;
    if (!trainerId) {
      const trainer = await Trainer.findOne({ user: req.user._id });
      if (trainer) trainerId = trainer._id;
      else {
        // Fallback to first active trainer if created by Admin
        const defaultTrainer = await Trainer.findOne();
        if (defaultTrainer) trainerId = defaultTrainer._id;
      }
    }

    const dietPlan = await DietPlan.create({
      member: memberId,
      trainer: trainerId,
      title,
      fitnessGoal: fitnessGoal || 'Muscle Gain',
      targetDailyCalories: Number(targetDailyCalories),
      targetProteinGrams: Number(targetProteinGrams) || 150,
      targetCarbsGrams: Number(targetCarbsGrams) || 250,
      targetFatsGrams: Number(targetFatsGrams) || 60,
      waterIntakeLiters: Number(waterIntakeLiters) || 3.5,
      meals: meals || [],
      notes: notes || '',
      status: 'Active'
    });

    const populated = await DietPlan.findById(dietPlan._id)
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name email' }
      })
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name' }
      });

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'DIET_PLAN_ASSIGNED',
      entity: 'DietPlan',
      entityId: dietPlan._id,
      details: `Diet plan "${title}" assigned with ${meals?.length || 0} meals`
    });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update diet plan
// @route   PUT /api/diet-plans/:id
const updateDietPlan = async (req, res) => {
  try {
    const updated = await DietPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Diet plan not found' });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDietPlans,
  createDietPlan,
  updateDietPlan
};
