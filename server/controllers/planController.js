const Plan = require('../models/Plan');
const logAudit = require('../utils/auditLogger');

/**
 * DBMS LAB CONCEPT - Membership Plan Catalog:
 * Demonstrates:
 * 1. Plan CRUD & active/retired status toggles
 * 2. Immutable membership snapshots: Changing a plan price here does NOT alter
 *    existing active memberships, preserving financial data integrity!
 */

// @desc    Get all plans (Public/Protected)
// @route   GET /api/plans
const getPlans = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status && status !== 'All') {
      filter.status = status;
    }

    const plans = await Plan.find(filter).sort({ price: 1 });
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get plan by ID
// @route   GET /api/plans/:id
const getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new membership plan
// @route   POST /api/plans
const createPlan = async (req, res) => {
  try {
    const { name, durationMonths, price, description, features, status } = req.body;
    if (!name || !durationMonths || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name, duration, and price are required' });
    }

    const plan = await Plan.create({
      name,
      durationMonths: Number(durationMonths),
      price: Number(price),
      description: description || '',
      features: features || [],
      status: status || 'Active'
    });

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'PLAN_CREATED',
      entity: 'Plan',
      entityId: plan._id,
      newValues: { name, durationMonths, price, status: plan.status }
    });

    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update membership plan (Edit price, duration, features, or retire/activate)
// @route   PUT /api/plans/:id
const updatePlan = async (req, res) => {
  try {
    const oldPlan = await Plan.findById(req.params.id);
    if (!oldPlan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const { name, durationMonths, price, description, features, status } = req.body;
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { name, durationMonths, price, description, features, status },
      { new: true, runValidators: true }
    );

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'PLAN_UPDATED',
      entity: 'Plan',
      entityId: plan._id,
      oldValues: { price: oldPlan.price, status: oldPlan.status },
      newValues: { price: plan.price, status: plan.status },
      details: `Plan ${plan.name} updated. Existing memberships preserve their historical price snapshot.`
    });

    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete plan
// @route   DELETE /api/plans/:id
const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'PLAN_DELETED',
      entity: 'Plan',
      entityId: plan._id,
      details: `Plan ${plan.name} deleted from catalog`
    });

    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
};
