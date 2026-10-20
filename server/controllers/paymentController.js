const Payment = require('../models/Payment');
const Member = require('../models/Member');
const Membership = require('../models/Membership');
const Invoice = require('../models/Invoice');
const logAudit = require('../utils/auditLogger');
const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Payment Controller & Financial Audit Operations:
 * Demonstrates:
 * 1. Financial auditing & refund state management
 * 2. MongoDB Aggregation Pipelines ($match, $group, $sort) for live revenue reports
 * 3. Atomic invoice generation and payment linkage
 */

// @desc    Record new payment
// @route   POST /api/payments
const createPayment = async (req, res) => {
  try {
    const { memberId, membershipId, amount, paymentMethod, notes, isDemoPayment = true } = req.body;

    if (!memberId || amount === undefined || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Member, amount, and payment method are required' });
    }

    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    const timestamp = Date.now();
    const transactionId = `TXN-${timestamp}-${Math.floor(100 + Math.random() * 900)}`;
    const invoiceNo = `INV-${new Date().getFullYear()}-${timestamp.toString().slice(-5)}`;

    const targetMembership = membershipId || member.currentMembership || null;

    const payment = await Payment.create({
      member: memberId,
      membership: targetMembership,
      amount: Number(amount),
      paymentMethod,
      transactionId,
      invoiceNo,
      notes: notes || '',
      status: 'Completed',
      isDemoPayment
    });

    // Create Invoice record
    await Invoice.create({
      invoiceNumber: invoiceNo,
      member: memberId,
      payment: payment._id,
      membership: targetMembership,
      planName: 'Gym Membership Fee',
      subTotal: Number(amount),
      totalAmount: Number(amount),
      status: 'Paid'
    });

    // If membership linked, update paid amount & dues
    if (targetMembership) {
      const membership = await Membership.findById(targetMembership).populate('plan');
      if (membership) {
        const allCompleted = await Payment.find({ membership: membership._id, status: 'Completed' });
        const totalPaid = allCompleted.reduce((sum, p) => sum + p.amount, 0);
        const price = membership.priceSnapshot || (membership.plan?.price || 0);
        membership.amountPaid = totalPaid;
        membership.outstandingDues = Math.max(0, price - totalPaid);
        membership.paymentStatus = membership.outstandingDues === 0 ? 'Paid' : 'Partial';
        await membership.save();
      }
    }

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name || 'Staff',
      actorRole: req.user?.role || 'Admin',
      action: 'PAYMENT_RECORDED',
      entity: 'Payment',
      entityId: payment._id,
      newValues: { amount, paymentMethod, transactionId, invoiceNo }
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate({
        path: 'membership',
        populate: { path: 'plan', select: 'name' }
      });

    res.status(201).json({ success: true, data: populatedPayment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all payments with search & filters
// @route   GET /api/payments
const getPayments = async (req, res) => {
  try {
    const { search, paymentMethod, status, memberId } = req.query;

    let filter = {};
    if (paymentMethod && paymentMethod !== 'All') {
      filter.paymentMethod = paymentMethod;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (memberId) {
      filter.member = memberId;
    }

    let payments = await Payment.find(filter)
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate({
        path: 'membership',
        populate: { path: 'plan', select: 'name' }
      })
      .sort({ paymentDate: -1 });

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      payments = payments.filter(p => 
        p.transactionId.match(searchRegex) ||
        p.invoiceNo.match(searchRegex) ||
        (p.member && p.member.user && searchRegex.test(p.member.user.name))
      );
    }

    // Revenue aggregations
    const totalRevenueAgg = await Payment.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyRevenueAgg = await Payment.aggregate([
      {
        $match: {
          status: 'Completed',
          paymentDate: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;

    res.json({
      success: true,
      data: payments,
      summary: {
        totalRevenue,
        monthlyRevenue,
        paymentCount: payments.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process refund on a payment
// @route   POST /api/payments/:id/refund
const refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    if (payment.status === 'Refunded') {
      return res.status(400).json({ success: false, message: 'This payment has already been refunded.' });
    }

    payment.status = 'Refunded';
    payment.isRefunded = true;
    payment.refundAmount = payment.amount;
    payment.refundDate = new Date();
    await payment.save();

    // Update corresponding invoice
    await Invoice.findOneAndUpdate({ payment: payment._id }, { status: 'Refunded' });

    // Update membership dues if applicable
    if (payment.membership) {
      const membership = await Membership.findById(payment.membership).populate('plan');
      if (membership) {
        const remainingCompleted = await Payment.find({ membership: membership._id, status: 'Completed' });
        const totalPaid = remainingCompleted.reduce((sum, p) => sum + p.amount, 0);
        const price = membership.priceSnapshot || (membership.plan?.price || 0);
        membership.amountPaid = totalPaid;
        membership.outstandingDues = Math.max(0, price - totalPaid);
        membership.paymentStatus = totalPaid === 0 ? 'Pending' : (membership.outstandingDues === 0 ? 'Paid' : 'Partial');
        await membership.save();
      }
    }

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'PAYMENT_REFUNDED',
      entity: 'Payment',
      entityId: payment._id,
      details: `Refunded payment of ₹${payment.amount} (Txn: ${payment.transactionId})`
    });

    res.json({
      success: true,
      message: `Payment of ₹${payment.amount} has been successfully refunded.`,
      data: payment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete payment record
// @route   DELETE /api/payments/:id
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    res.json({ success: true, message: 'Payment record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPayment,
  getPayments,
  refundPayment,
  deletePayment
};
