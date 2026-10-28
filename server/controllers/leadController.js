const Lead = require('../models/Lead');
const User = require('../models/User');
const Member = require('../models/Member');
const Plan = require('../models/Plan');
const Membership = require('../models/Membership');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const logAudit = require('../utils/auditLogger');

/**
 * DBMS LAB CONCEPT - Leads & Prospect Conversion:
 * Demonstrates:
 * 1. Embedded interaction logs (follow-ups)
 * 2. Pipeline status progression: 'New' -> 'Contacted' -> 'Trial Active' -> 'Converted'
 * 3. Safe entity conversion into Member/User preventing duplicate registrations
 */

// @desc    Get all leads with filters
// @route   GET /api/leads
const getLeads = async (req, res) => {
  try {
    const { status, interest, search } = req.query;
    let filter = {};

    if (status && status !== 'All') filter.status = status;
    if (interest && interest !== 'All') filter.interest = interest;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const leads = await Lead.find(filter)
      .populate('convertedMember')
      .sort({ createdAt: -1 });

    const total = await Lead.countDocuments();
    const trialActive = await Lead.countDocuments({ status: 'Trial Active' });
    const converted = await Lead.countDocuments({ status: 'Converted' });

    res.json({
      success: true,
      data: leads,
      stats: { total, trialActive, converted }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new lead / trial pass inquiry
// @route   POST /api/leads
const createLead = async (req, res) => {
  try {
    const { fullName, email, phone, interest, source, notes, hasTrialPass = true } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ success: false, message: 'Prospect full name and phone number are required' });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3); // 3-day pass

    const lead = await Lead.create({
      fullName,
      email: email ? email.toLowerCase() : '',
      phone,
      interest: interest || 'General Fitness',
      source: source || 'Website',
      status: hasTrialPass ? 'Trial Active' : 'New',
      hasTrialPass,
      trialStartDate: hasTrialPass ? startDate : null,
      trialEndDate: hasTrialPass ? endDate : null,
      notes: notes || '',
      followUps: [{
        date: new Date(),
        notes: 'Initial inquiry received & 3-day trial pass granted.',
        contactedBy: req.user?._id
      }]
    });

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name || 'Reception',
      actorRole: req.user?.role || 'Admin',
      action: 'LEAD_REGISTERED',
      entity: 'Lead',
      entityId: lead._id,
      newValues: { fullName, phone, interest, status: lead.status }
    });

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add follow-up notes to a lead
// @route   POST /api/leads/:id/follow-up
const addLeadFollowUp = async (req, res) => {
  try {
    const { notes, status } = req.body;
    const lead = await Lead.findById(req.params.id);

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    lead.followUps.push({
      date: new Date(),
      notes,
      contactedBy: req.user?._id
    });

    if (status) lead.status = status;
    await lead.save();

    res.json({ success: true, message: 'Follow-up logged successfully', data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Convert lead into full gym Member
// @route   POST /api/leads/:id/convert
const convertLeadToMember = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    if (lead.status === 'Converted') {
      return res.status(400).json({ success: false, message: 'This lead has already been converted into a member.' });
    }

    const { planId, password = 'Password@123', paymentMethod = 'Cash' } = req.body;

    // Check unique email constraint
    let userEmail = lead.email;
    if (!userEmail) {
      userEmail = `member_${Date.now().toString().slice(-4)}@gymflow.local`;
    }

    const existingUser = await User.findOne({ email: userEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: `An account with email "${userEmail}" already exists. Prevent duplicate account.` });
    }

    // Fetch Plan
    const plan = planId ? await Plan.findById(planId) : await Plan.findOne({ status: 'Active' }).sort({ price: 1 });
    if (!plan) return res.status(400).json({ success: false, message: 'Active membership plan required for conversion.' });

    // 1. Create User
    const user = await User.create({
      name: lead.fullName,
      email: userEmail,
      password,
      phone: lead.phone,
      role: 'Member'
    });

    // 2. Create Member
    const count = await Member.countDocuments();
    let nextNum = 1001 + count;
    let customId = `GF-${nextNum}`;
    while (await Member.findOne({ memberCustomId: customId })) {
      nextNum++;
      customId = `GF-${nextNum}`;
    }
    const member = await Member.create({
      user: user._id,
      memberCustomId: customId,
      status: 'Active'
    });

    // 3. Create Membership with snapshots
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    const membership = await Membership.create({
      member: member._id,
      plan: plan._id,
      priceSnapshot: plan.price,
      durationMonthsSnapshot: plan.durationMonths,
      startDate,
      endDate,
      originalEndDate: endDate,
      status: 'Active',
      paymentStatus: 'Paid',
      amountPaid: plan.price,
      outstandingDues: 0
    });

    member.currentMembership = membership._id;
    await member.save();

    // 4. Create Payment & Invoice
    const invoiceNo = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const payment = await Payment.create({
      member: member._id,
      membership: membership._id,
      amount: plan.price,
      paymentMethod,
      transactionId: `TXN-CONV-${Date.now().toString().slice(-6)}`,
      invoiceNo,
      status: 'Completed',
      isDemoPayment: true,
      notes: `Lead converted to full membership for ${plan.name}`
    });

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

    // 5. Update lead document
    lead.status = 'Converted';
    lead.convertedMember = member._id;
    lead.followUps.push({
      date: new Date(),
      notes: `Successfully converted into registered member (${customId}) on ${plan.name}`,
      contactedBy: req.user?._id
    });
    await lead.save();

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'LEAD_CONVERTED_TO_MEMBER',
      entity: 'Lead',
      entityId: lead._id,
      newValues: { memberId: member._id, memberCustomId: customId, plan: plan.name },
      details: `Converted prospect ${lead.fullName} into Member ${customId}`
    });

    res.status(201).json({
      success: true,
      message: `Lead converted successfully into Member ${customId}!`,
      data: {
        lead,
        member,
        customId,
        userEmail
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLeads,
  createLead,
  addLeadFollowUp,
  convertLeadToMember
};
