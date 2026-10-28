const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getRazorpayInstance } = require('../config/razorpay');
const Plan = require('../models/Plan');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const Member = require('../models/Member');
const Membership = require('../models/Membership');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const logAudit = require('../utils/auditLogger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

/**
 * @desc    Get public Razorpay Key ID
 * @route   GET /api/payments/razorpay-key
 * @access  Public
 */
const getRazorpayKey = (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    return res.status(500).json({
      success: false,
      message: 'Razorpay Key ID is not configured on the server.'
    });
  }
  res.json({
    success: true,
    keyId
  });
};

/**
 * @desc    Create Razorpay Order with authoritative plan price from MongoDB
 * @route   POST /api/payments/razorpay/create-order
 * @access  Public (for registration) or Authenticated
 */
const createRazorpayOrder = async (req, res) => {
  try {
    const { planId, couponCode } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, message: 'Plan ID is required to create a payment order.' });
    }

    // 1. Fetch authoritative plan from MongoDB (NEVER trust frontend price!)
    const plan = await Plan.findById(planId);
    if (!plan || plan.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Selected membership plan is invalid or inactive.' });
    }

    let finalPrice = plan.price;
    let discountApplied = 0;
    let appliedCoupon = null;

    // 2. Validate Coupon if provided
    if (couponCode) {
      const cleanCode = couponCode.trim().toUpperCase();
      const now = new Date();
      appliedCoupon = await Coupon.findOne({
        code: cleanCode,
        status: 'Active',
        validUntil: { $gte: now },
        $expr: { $lt: ['$timesUsed', '$usageLimit'] }
      });

      if (appliedCoupon) {
        if (appliedCoupon.discountType === 'Percentage') {
          discountApplied = Math.min(Math.round((plan.price * appliedCoupon.discountValue) / 100), appliedCoupon.maxDiscount || 5000);
        } else {
          discountApplied = appliedCoupon.discountValue;
        }
        finalPrice = Math.max(0, plan.price - discountApplied);
      }
    }

    // 3. Initialize Razorpay SDK instance
    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay SDK is not initialized. Please verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env.'
      });
    }

    // 4. Create Razorpay order (amount in paise)
    const amountInPaise = Math.round(finalPrice * 100);
    const receiptId = `rcpt_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        planId: plan._id.toString(),
        planName: plan.name,
        durationMonths: plan.durationMonths.toString(),
        couponCode: couponCode || ''
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount, // in paise
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        plan: {
          id: plan._id,
          name: plan.name,
          basePrice: plan.price,
          discount: discountApplied,
          finalPrice: finalPrice
        }
      }
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create Razorpay order.' });
  }
};

/**
 * @desc    Verify Razorpay payment signature & activate membership
 * @route   POST /api/payments/razorpay/verify
 * @access  Public (for new registration) or Authenticated
 */
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      couponCode,
      registrationData
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing Razorpay verification parameters (order_id, payment_id, or signature).'
      });
    }

    // 1. Cryptographic HMAC-SHA256 signature verification (Key Secret on backend only)
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay secret key is not configured on the server.'
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Security warning: Signature mismatch! Reject & log audit
      await logAudit({
        actor: req.user?._id || null,
        actorName: registrationData?.name || 'Unauthenticated User',
        actorRole: 'System',
        action: 'PAYMENT_SIGNATURE_VERIFICATION_FAILED',
        entity: 'Payment',
        details: `Invalid signature for Order ${razorpay_order_id} and Payment ${razorpay_payment_id}. Verification failed.`
      });

      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Payment verification failed: Invalid Razorpay cryptographic signature. Membership was not activated.'
      });
    }

    // 2. Prevent Duplicate Payment Processing
    const existingPayment = await Payment.findOne({
      $or: [
        { transactionId: razorpay_payment_id },
        { razorpayPaymentId: razorpay_payment_id }
      ]
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: `Security Warning: Payment ID ${razorpay_payment_id} has already been processed and verified.`
      });
    }

    // 3. Fetch authoritative plan
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Associated membership plan not found in database.' });
    }

    let finalPrice = plan.price;
    let discountApplied = 0;

    // Apply coupon if valid
    if (couponCode) {
      const cleanCode = couponCode.trim().toUpperCase();
      const coupon = await Coupon.findOneAndUpdate(
        {
          code: cleanCode,
          status: 'Active',
          validUntil: { $gte: new Date() },
          $expr: { $lt: ['$timesUsed', '$usageLimit'] }
        },
        { $inc: { timesUsed: 1 } },
        { new: true }
      );

      if (coupon) {
        if (coupon.discountType === 'Percentage') {
          discountApplied = Math.min(Math.round((plan.price * coupon.discountValue) / 100), coupon.maxDiscount || 5000);
        } else {
          discountApplied = coupon.discountValue;
        }
        finalPrice = Math.max(0, plan.price - discountApplied);
      }
    }

    // 4. Handle User & Member Accounts
    let user = req.user;
    let member = null;

    if (registrationData) {
      const { name, email, phone, password } = registrationData;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Registration fields name, email, and password are required.' });
      }

      // Check if user already exists
      let existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists. Please log in first.'
        });
      }

      // Create User with enforced 'Member' role
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        phone: phone || '',
        role: 'Member'
      });

      const memberCount = await Member.countDocuments();
      const customId = `GF-${1001 + memberCount}`;

      member = await Member.create({
        user: user._id,
        memberCustomId: customId,
        emergencyContact: '',
        status: 'Active'
      });
    } else if (req.user) {
      member = await Member.findOne({ user: req.user._id });
      if (!member) {
        return res.status(404).json({ success: false, message: 'Member profile record not found.' });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'User authentication or new registration details are required to link this payment.'
      });
    }

    // 5. Calculate Server Dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    // 6. Create Activated Membership
    const membership = await Membership.create({
      member: member._id,
      plan: plan._id,
      priceSnapshot: finalPrice,
      durationMonthsSnapshot: plan.durationMonths,
      startDate,
      endDate,
      status: 'Active',
      paymentStatus: 'Paid'
    });

    member.currentMembership = membership._id;
    member.status = 'Active';
    await member.save();

    // 7. Record Verified Payment in MongoDB
    const invoiceNo = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const payment = await Payment.create({
      member: member._id,
      membership: membership._id,
      amount: finalPrice,
      discountApplied,
      couponCode: couponCode || null,
      paymentMethod: 'Razorpay',
      paymentDate: new Date(),
      transactionId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      invoiceNo,
      status: 'Completed',
      isDemoPayment: false, // Verified via Razorpay Test Mode Gateway!
      notes: `Verified Razorpay Payment for ${plan.name} (${plan.durationMonths} Months)`
    });

    // 8. Generate Invoice
    const invoice = await Invoice.create({
      invoiceNumber: invoiceNo,
      member: member._id,
      payment: payment._id,
      membership: membership._id,
      planName: plan.name,
      subTotal: plan.price,
      discountAmount: discountApplied,
      taxAmount: Math.round(finalPrice * 0.18),
      totalAmount: finalPrice,
      status: 'Paid'
    });

    // 9. Record Compliance Audit Log
    await logAudit({
      actor: user._id,
      actorName: user.name,
      actorRole: 'Member',
      action: 'RAZORPAY_PAYMENT_VERIFIED',
      entity: 'Payment',
      entityId: payment._id,
      newValues: {
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        amount: finalPrice,
        plan: plan.name,
        membershipId: membership._id
      },
      details: `Razorpay payment ${razorpay_payment_id} verified via HMAC-SHA256. Activated ${plan.name} membership.`
    });

    // Return authenticated session & records
    res.status(200).json({
      success: true,
      verified: true,
      message: 'Payment verified successfully! Membership is now Active.',
      data: {
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileId: member._id,
          customId: member.memberCustomId,
          membershipId: membership._id,
          planName: plan.name
        },
        payment: {
          id: payment._id,
          transactionId: payment.transactionId,
          amount: payment.amount,
          invoiceNo: payment.invoiceNo,
          status: payment.status
        },
        membership: {
          id: membership._id,
          startDate: membership.startDate,
          endDate: membership.endDate,
          status: membership.status
        }
      }
    });
  } catch (error) {
    console.error('Razorpay verification error:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment verification failed.' });
  }
};

module.exports = {
  getRazorpayKey,
  createRazorpayOrder,
  verifyRazorpayPayment
};
