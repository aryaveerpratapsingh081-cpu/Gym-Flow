const Membership = require('../models/Membership');
const Member = require('../models/Member');
const Plan = require('../models/Plan');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const logAudit = require('../utils/auditLogger');

/**
 * DBMS LAB CONCEPT - Membership Controller with Full Lifecycle Management:
 * Demonstrates:
 * 1. Price & Duration Snapshots
 * 2. Membership Freeze & Expiry Extension calculation
 * 3. Renewal transactions with payment & invoice updates
 * 4. Dues settlement and partial payment tracking
 * 5. Audit Logging on every state mutation
 */

/**
 * @desc    Assign plan to a member & auto-calculate End Date with Snapshots
 * @route   POST /api/memberships
 * @access  Private (Admin)
 */
const assignMembership = async (req, res) => {
  try {
    const { memberId, planId, startDate, autoRenew = false, paymentMethod = 'Cash' } = req.body;

    if (!memberId || !planId) {
      return res.status(400).json({ success: false, message: 'Member ID and Plan ID are required' });
    }

    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    const plan = await Plan.findById(planId);
    if (!plan || plan.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Plan not found or currently inactive' });
    }

    // Calculate dates
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + plan.durationMonths);

    // Create Membership document with snapshots
    const membership = await Membership.create({
      member: memberId,
      plan: planId,
      priceSnapshot: plan.price,
      durationMonthsSnapshot: plan.durationMonths,
      startDate: start,
      endDate: end,
      originalEndDate: end,
      status: 'Active',
      paymentStatus: 'Paid',
      amountPaid: plan.price,
      outstandingDues: 0,
      autoRenew
    });

    // Update member's currentMembership reference & status
    member.currentMembership = membership._id;
    member.status = 'Active';
    await member.save();

    // Create Payment record
    const timestampStr = Date.now().toString().slice(-6);
    const invoiceNo = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const payment = await Payment.create({
      member: member._id,
      membership: membership._id,
      amount: plan.price,
      paymentMethod,
      transactionId: `TXN-ASSIGN-${timestampStr}`,
      invoiceNo,
      status: 'Completed',
      isDemoPayment: true,
      notes: `Admin assigned ${plan.name} (${plan.durationMonths} Months)`
    });

    // Create Invoice
    await Invoice.create({
      invoiceNumber: invoiceNo,
      member: member._id,
      payment: payment._id,
      membership: membership._id,
      planName: plan.name,
      subTotal: plan.price,
      totalAmount: plan.price,
      status: 'Paid'
    });

    // Audit log
    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'Admin',
      action: 'MEMBERSHIP_ASSIGNED',
      entity: 'Membership',
      entityId: membership._id,
      newValues: {
        plan: plan.name,
        priceSnapshot: plan.price,
        startDate: start,
        endDate: end
      },
      details: `Assigned ${plan.name} to member ${member.memberCustomId}`
    });

    const populatedMembership = await Membership.findById(membership._id)
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate('plan');

    res.status(201).json({ success: true, data: populatedMembership });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all memberships with derived lifecycle statuses
 * @route   GET /api/memberships
 * @access  Private
 */
const getMemberships = async (req, res) => {
  try {
    const { status, memberId } = req.query;
    let filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (memberId) {
      filter.member = memberId;
    }

    const memberships = await Membership.find(filter)
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name email phone avatar' }
      })
      .populate('plan')
      .sort({ createdAt: -1 });

    // Derive real-time effective statuses
    const now = new Date();
    const updatedMemberships = await Promise.all(memberships.map(async (m) => {
      let currentStatus = m.status;
      if (m.status !== 'Frozen' && m.status !== 'Cancelled' && m.status !== 'Pending Payment') {
        if (new Date(m.endDate) < now) {
          currentStatus = 'Expired';
        } else {
          const daysLeft = Math.ceil((new Date(m.endDate) - now) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 7) {
            currentStatus = 'Expiring Soon';
          } else {
            currentStatus = 'Active';
          }
        }
      }
      if (m.status !== currentStatus) {
        m.status = currentStatus;
        await m.save();
      }
      return m;
    }));

    res.json({ success: true, data: updatedMemberships });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get memberships expiring within 7 days
 * @route   GET /api/memberships/expiring
 * @access  Private (Admin, Trainer)
 */
const getExpiringMemberships = async (req, res) => {
  try {
    const today = new Date();
    const inSevenDays = new Date();
    inSevenDays.setDate(today.getDate() + 7);

    const expiringMemberships = await Membership.find({
      status: { $in: ['Active', 'Expiring Soon'] },
      endDate: { $gte: today, $lte: inSevenDays }
    })
    .populate({
      path: 'member',
      populate: { path: 'user', select: 'name email phone' }
    })
    .populate('plan')
    .sort({ endDate: 1 });

    res.json({ success: true, data: expiringMemberships, count: expiringMemberships.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Freeze Membership (Pause validity & calculate freeze days)
 * @route   PUT /api/memberships/:id/freeze
 * @access  Private (Admin, Member)
 */
const freezeMembership = async (req, res) => {
  try {
    const { reason = 'Medical / Travel reasons' } = req.body;
    const membership = await Membership.findById(req.params.id).populate('member');

    if (!membership) {
      return res.status(404).json({ success: false, message: 'Membership not found' });
    }

    if (membership.status === 'Frozen') {
      return res.status(400).json({ success: false, message: 'Membership is already frozen' });
    }

    if (membership.status === 'Expired' || membership.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: `Cannot freeze a membership that is ${membership.status}` });
    }

    const oldStatus = membership.status;
    membership.status = 'Frozen';
    membership.isFrozen = true;
    membership.freezeHistory.push({
      freezeDate: new Date(),
      reason
    });

    await membership.save();

    // Update member entity status
    await Member.findByIdAndUpdate(membership.member._id, { status: 'Pending' });

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name || 'User',
      actorRole: req.user?.role || 'Admin',
      action: 'MEMBERSHIP_FROZEN',
      entity: 'Membership',
      entityId: membership._id,
      oldValues: { status: oldStatus },
      newValues: { status: 'Frozen', reason },
      details: `Membership paused with reason: ${reason}`
    });

    res.json({
      success: true,
      message: 'Membership successfully frozen. Validity is paused.',
      data: membership
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Resume Frozen Membership & extend End Date by days frozen
 * @route   PUT /api/memberships/:id/resume
 * @access  Private (Admin, Member)
 */
const resumeMembership = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id).populate('member');

    if (!membership) {
      return res.status(404).json({ success: false, message: 'Membership not found' });
    }

    if (!membership.isFrozen && membership.status !== 'Frozen') {
      return res.status(400).json({ success: false, message: 'Membership is not currently frozen' });
    }

    // Find the latest open freeze record
    const latestFreeze = membership.freezeHistory[membership.freezeHistory.length - 1];
    const resumeDate = new Date();
    let daysFrozen = 1;

    if (latestFreeze && latestFreeze.freezeDate) {
      latestFreeze.resumeDate = resumeDate;
      const diffMs = resumeDate - new Date(latestFreeze.freezeDate);
      daysFrozen = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      latestFreeze.daysFrozen = daysFrozen;
    }

    // Extend end date by days frozen
    const oldEndDate = new Date(membership.endDate);
    const newEndDate = new Date(oldEndDate);
    newEndDate.setDate(newEndDate.getDate() + daysFrozen);

    membership.endDate = newEndDate;
    membership.status = 'Active';
    membership.isFrozen = false;
    await membership.save();

    // Restore member entity status
    await Member.findByIdAndUpdate(membership.member._id, { status: 'Active' });

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name || 'User',
      actorRole: req.user?.role || 'Admin',
      action: 'MEMBERSHIP_RESUMED',
      entity: 'Membership',
      entityId: membership._id,
      oldValues: { endDate: oldEndDate, status: 'Frozen' },
      newValues: { endDate: newEndDate, status: 'Active', daysExtended: daysFrozen },
      details: `Membership resumed. Expiry extended by ${daysFrozen} days.`
    });

    res.json({
      success: true,
      message: `Membership resumed! Expiry date extended by ${daysFrozen} days to ${newEndDate.toLocaleDateString()}.`,
      data: membership
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Renew Membership with plan selection and payment recording
 * @route   POST /api/memberships/:id/renew
 * @access  Private (Admin, Member)
 */
const renewMembership = async (req, res) => {
  try {
    const { planId, paymentMethod = 'UPI' } = req.body;
    const currentMembership = await Membership.findById(req.params.id);

    if (!currentMembership) {
      return res.status(404).json({ success: false, message: 'Membership not found' });
    }

    const selectedPlanId = planId || currentMembership.plan;
    const plan = await Plan.findById(selectedPlanId);

    if (!plan || plan.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Selected plan is inactive or unavailable' });
    }

    const now = new Date();
    // If current membership has not expired, extend from current end date; otherwise extend from now
    const startDate = new Date(currentMembership.endDate) > now ? new Date(currentMembership.endDate) : now;
    const newEndDate = new Date(startDate);
    newEndDate.setMonth(newEndDate.getMonth() + plan.durationMonths);

    // Create renewed Membership record
    const renewed = await Membership.create({
      member: currentMembership.member,
      plan: plan._id,
      priceSnapshot: plan.price,
      durationMonthsSnapshot: plan.durationMonths,
      startDate,
      endDate: newEndDate,
      originalEndDate: newEndDate,
      status: 'Active',
      paymentStatus: 'Paid',
      amountPaid: plan.price,
      outstandingDues: 0
    });

    // Update Member entity current membership
    await Member.findByIdAndUpdate(currentMembership.member, {
      currentMembership: renewed._id,
      status: 'Active'
    });

    // Create Payment record
    const timestampStr = Date.now().toString().slice(-6);
    const invoiceNo = `INV-REN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const payment = await Payment.create({
      member: currentMembership.member,
      membership: renewed._id,
      amount: plan.price,
      paymentMethod,
      transactionId: `TXN-RENEW-${timestampStr}`,
      invoiceNo,
      status: 'Completed',
      isDemoPayment: true,
      notes: `Renewal of membership for ${plan.name} (${plan.durationMonths} Months)`
    });

    // Create Invoice
    await Invoice.create({
      invoiceNumber: invoiceNo,
      member: currentMembership.member,
      payment: payment._id,
      membership: renewed._id,
      planName: plan.name,
      subTotal: plan.price,
      totalAmount: plan.price,
      status: 'Paid'
    });

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name || 'User',
      actorRole: req.user?.role || 'Admin',
      action: 'MEMBERSHIP_RENEWED',
      entity: 'Membership',
      entityId: renewed._id,
      newValues: {
        plan: plan.name,
        priceSnapshot: plan.price,
        startDate,
        endDate: newEndDate
      },
      details: `Renewed membership on ${plan.name} until ${newEndDate.toLocaleDateString()}`
    });

    res.status(201).json({
      success: true,
      message: `Membership successfully renewed until ${newEndDate.toLocaleDateString()}!`,
      data: renewed
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update membership status manually
 * @route   PUT /api/memberships/:id/status
 * @access  Private (Admin)
 */
const updateMembershipStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const membership = await Membership.findById(req.params.id);
    if (!membership) return res.status(404).json({ success: false, message: 'Membership not found' });

    const oldStatus = membership.status;
    membership.status = status;
    await membership.save();

    if (status === 'Expired' || status === 'Cancelled') {
      await Member.findByIdAndUpdate(membership.member, { status });
    }

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'Admin',
      action: 'MEMBERSHIP_STATUS_CHANGED',
      entity: 'Membership',
      entityId: membership._id,
      oldValues: { status: oldStatus },
      newValues: { status }
    });

    res.json({ success: true, data: membership });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  assignMembership,
  getMemberships,
  getExpiringMemberships,
  freezeMembership,
  resumeMembership,
  renewMembership,
  updateMembershipStatus
};
