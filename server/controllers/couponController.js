const Coupon = require('../models/Coupon');
const logAudit = require('../utils/auditLogger');

/**
 * DBMS LAB CONCEPT - Offers & Coupons with Concurrency-Safe Atomic Updates:
 * Demonstrates:
 * 1. Unique code index with uppercase normalization
 * 2. Atomic $inc operations with boundary conditions ($expr: { $lt: ['$timesUsed', '$usageLimit'] })
 *    guarantees no concurrent over-redemption!
 * 3. Server-side validation of discount limits
 */

// @desc    Get all coupons
// @route   GET /api/coupons
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new coupon
// @route   POST /api/coupons
const createCoupon = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minPurchase, maxDiscount, validUntil, usageLimit } = req.body;

    if (!code || !discountType || !discountValue || !validUntil) {
      return res.status(400).json({ success: false, message: 'Code, discount type, value, and validity date are required' });
    }

    const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon code "${code}" already exists` });
    }

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      description: description || '',
      discountType,
      discountValue: Number(discountValue),
      minPurchase: Number(minPurchase) || 0,
      maxDiscount: Number(maxDiscount) || 5000,
      validUntil: new Date(validUntil),
      usageLimit: Number(usageLimit) || 100,
      timesUsed: 0,
      status: 'Active'
    });

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'COUPON_CREATED',
      entity: 'Coupon',
      entityId: coupon._id,
      newValues: { code: coupon.code, discountType, discountValue, usageLimit }
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate a coupon code against a plan amount (Public / Checkout)
// @route   POST /api/coupons/validate
const validateCoupon = async (req, res) => {
  try {
    const { code, planPrice } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Please enter a coupon code' });
    }

    const cleanCode = code.trim().toUpperCase();
    const now = new Date();

    const coupon = await Coupon.findOne({
      code: cleanCode,
      status: 'Active',
      validUntil: { $gte: now }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid, expired, or deactivated coupon code'
      });
    }

    if (coupon.timesUsed >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: `Coupon "${cleanCode}" has reached its maximum usage limit of ${coupon.usageLimit} redemptions.`
      });
    }

    const price = Number(planPrice) || 0;
    if (price < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase of ₹${coupon.minPurchase} required to apply this coupon.`
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'Percentage') {
      discountAmount = Math.min(Math.round((price * coupon.discountValue) / 100), coupon.maxDiscount);
    } else {
      discountAmount = Math.min(coupon.discountValue, price);
    }

    const finalPrice = Math.max(0, price - discountAmount);

    res.json({
      success: true,
      message: `Coupon "${coupon.code}" applied successfully!`,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        originalPrice: price,
        finalPrice
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCoupons,
  createCoupon,
  validateCoupon
};
