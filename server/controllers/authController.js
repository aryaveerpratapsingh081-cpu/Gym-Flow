const User = require('../models/User');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const Plan = require('../models/Plan');
const Membership = require('../models/Membership');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Coupon = require('../models/Coupon');
const jwt = require('jsonwebtoken');
const logAudit = require('../utils/auditLogger');

// Generate JWT token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'gymflow_dbms_lab_review_super_secret_jwt_key_2026', {
    expiresIn: '30d'
  });
};

/**
 * @desc    Login user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // DBMS LAB QUERY: findOne by indexed email field (O(1) execution time)
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
      let profileId = null;
      let customId = null;

      if (user.role === 'Member') {
        const member = await Member.findOne({ user: user._id }).populate({
          path: 'currentMembership',
          populate: { path: 'plan' }
        });
        if (member) {
          profileId = member._id;
          customId = member.memberCustomId;
        }
      } else if (user.role === 'Trainer') {
        const trainer = await Trainer.findOne({ user: user._id });
        if (trainer) {
          profileId = trainer._id;
          customId = trainer.trainerCustomId;
        }
      }

      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          profileId,
          customId,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Complete Public Registration Flow with Plan Selection & Demo Payment
 * @route   POST /api/auth/register
 * @access  Public
 * 
 * DBMS LAB IMPLEMENTATION:
 * 1. Security: Strictly forces role = 'Member'. Rejects elevation attempts.
 * 2. Server-Authoritative Price Calculation: Fetches Plan from MongoDB directly; never trusts client prices!
 * 3. Atomic Coupon Redemption with boundary conditions.
 * 4. Multi-Collection Relationship Creation: User -> Member -> Membership -> Payment -> Invoice.
 * 5. Full Audit Log Emission.
 */
const registerUser = async (req, res) => {
  let createdUserId = null;
  let createdMemberId = null;
  let createdMembershipId = null;
  let createdPaymentId = null;
  let createdInvoiceId = null;

  try {
    const { name, email, password, phone, planId, paymentMethod = 'UPI', couponCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check unique email constraint
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // Verify Plan in MongoDB
    let plan = null;
    if (planId) {
      plan = await Plan.findById(planId);
      if (!plan || plan.status !== 'Active') {
        return res.status(400).json({ success: false, message: 'Selected membership plan is invalid or inactive' });
      }
    } else {
      // Default to Basic Plan if none passed
      plan = await Plan.findOne({ status: 'Active' }).sort({ price: 1 });
      if (!plan) {
        return res.status(400).json({ success: false, message: 'No active membership plans available' });
      }
    }

    // Server-side authoritative price snapshot & coupon calculation
    let finalPrice = plan.price;
    let discountApplied = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const cleanCode = couponCode.trim().toUpperCase();
      const now = new Date();
      appliedCoupon = await Coupon.findOneAndUpdate(
        {
          code: cleanCode,
          status: 'Active',
          validUntil: { $gte: now },
          $expr: { $lt: ['$timesUsed', '$usageLimit'] }
        },
        { $inc: { timesUsed: 1 } },
        { new: true }
      );

      if (appliedCoupon) {
        if (appliedCoupon.discountType === 'Percentage') {
          discountApplied = Math.min(Math.round((plan.price * appliedCoupon.discountValue) / 100), appliedCoupon.maxDiscount || 5000);
        } else {
          discountApplied = appliedCoupon.discountValue;
        }
        finalPrice = Math.max(0, plan.price - discountApplied);
      }
    }

    // 1. Create User with enforced 'Member' role
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: 'Member' // Strictly enforce Member role for public registrations!
    });
    createdUserId = user._id;

    // 2. Generate unique Member custom ID (GF-1001+)
    const memberCount = await Member.countDocuments();
    let nextNum = 1001 + memberCount;
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
    createdMemberId = member._id;

    // 3. Calculate start & end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    // 4. Create Membership record with server price snapshot
    const membership = await Membership.create({
      member: member._id,
      plan: plan._id,
      priceSnapshot: finalPrice,
      durationMonthsSnapshot: plan.durationMonths,
      startDate,
      endDate,
      originalEndDate: endDate,
      status: 'Active',
      paymentStatus: 'Paid',
      amountPaid: finalPrice,
      outstandingDues: 0
    });
    createdMembershipId = membership._id;

    // Link current membership to member
    member.currentMembership = membership._id;
    await member.save();

    // 5. Record Payment transaction
    const timestampStr = Date.now().toString().slice(-6);
    const transactionId = `TXN-DEMO-${timestampStr}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceNo = `INV-${new Date().getFullYear()}-${timestampStr}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await Payment.create({
      member: member._id,
      membership: membership._id,
      amount: finalPrice,
      discountApplied,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      paymentMethod,
      transactionId,
      invoiceNo,
      status: 'Completed',
      isDemoPayment: true,
      notes: `Demo online checkout registration for ${plan.name} (${plan.durationMonths} Months)`
    });
    createdPaymentId = payment._id;

    // 6. Generate Invoice
    const invoice = await Invoice.create({
      invoiceNumber: invoiceNo,
      member: member._id,
      payment: payment._id,
      membership: membership._id,
      planName: plan.name,
      subTotal: plan.price,
      discountAmount: discountApplied,
      taxAmount: Math.round(finalPrice * 0.18), // 18% GST display
      totalAmount: finalPrice,
      status: 'Paid'
    });
    createdInvoiceId = invoice._id;

    // 7. Audit Log
    await logAudit({
      actor: user._id,
      actorName: user.name,
      actorRole: 'Member',
      action: 'MEMBER_REGISTERED_WITH_PLAN',
      entity: 'Member',
      entityId: member._id,
      newValues: {
        memberCustomId: customId,
        plan: plan.name,
        priceSnapshot: finalPrice,
        paymentStatus: 'Paid'
      },
      details: `New member self-registered via public portal on ${plan.name}`
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileId: member._id,
        customId,
        membershipId: membership._id,
        planName: plan.name,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    // Safe transactional cleanup on failure
    try {
      if (createdInvoiceId) await Invoice.findByIdAndDelete(createdInvoiceId);
      if (createdPaymentId) await Payment.findByIdAndDelete(createdPaymentId);
      if (createdMembershipId) await Membership.findByIdAndDelete(createdMembershipId);
      if (createdMemberId) await Member.findByIdAndDelete(createdMemberId);
      if (createdUserId) await User.findByIdAndDelete(createdUserId);
    } catch (cleanupErr) {
      console.error('Error rolling back registration:', cleanupErr);
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Current Logged in User Profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let profile = null;
    if (user.role === 'Member') {
      profile = await Member.findOne({ user: user._id })
        .populate({
          path: 'currentMembership',
          populate: { path: 'plan' }
        })
        .populate({
          path: 'assignedTrainer',
          populate: { path: 'user', select: 'name email phone' }
        });
    } else if (user.role === 'Trainer') {
      profile = await Trainer.findOne({ user: user._id });
    }

    res.json({
      success: true,
      data: {
        user,
        profile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  loginUser,
  registerUser,
  getMe
};
