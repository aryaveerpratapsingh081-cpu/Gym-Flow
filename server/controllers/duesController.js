const Membership = require('../models/Membership');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Member = require('../models/Member');
const logAudit = require('../utils/auditLogger');

/**
 * DBMS LAB CONCEPT - Dues & Defaulters Aggregation:
 * Demonstrates:
 * 1. Financial reconciliation: (Membership Price - Total Sum of Completed Payments = Outstanding Dues)
 * 2. Partial payment recording & status updates ('Paid' | 'Partial' | 'Pending')
 * 3. Aggregation pipeline to calculate total outstanding gym receivables
 */

// @desc    Get all members with outstanding dues or payment status
// @route   GET /api/dues
const getDuesAndDefaulters = async (req, res) => {
  try {
    const { status } = req.query;

    const memberships = await Membership.find()
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate('plan')
      .sort({ endDate: 1 });

    // Aggregate dues per membership
    const duesList = await Promise.all(memberships.map(async (m) => {
      // Sum all completed payments for this membership
      const payments = await Payment.find({ membership: m._id, status: 'Completed' });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const originalPrice = m.priceSnapshot || (m.plan ? m.plan.price : 0);
      const outstanding = Math.max(0, originalPrice - totalPaid);

      let paymentStatus = 'Paid';
      if (totalPaid === 0) paymentStatus = 'Pending';
      else if (outstanding > 0) paymentStatus = 'Partial';

      return {
        _id: m._id,
        member: m.member,
        plan: m.plan,
        membershipPrice: originalPrice,
        totalPaid,
        outstandingAmount: outstanding,
        dueDate: m.endDate,
        membershipStatus: m.status,
        paymentStatus,
        paymentsCount: payments.length
      };
    }));

    // Filter list
    let filtered = duesList;
    if (status === 'Defaulters' || status === 'Outstanding') {
      filtered = duesList.filter(d => d.outstandingAmount > 0);
    } else if (status && status !== 'All') {
      filtered = duesList.filter(d => d.paymentStatus === status);
    }

    // Total outstanding sum
    const totalGymOutstanding = duesList.reduce((sum, d) => sum + d.outstandingAmount, 0);
    const defaultersCount = duesList.filter(d => d.outstandingAmount > 0).length;

    res.json({
      success: true,
      data: filtered,
      stats: {
        totalOutstandingReceivable: totalGymOutstanding,
        totalDefaulters: defaultersCount,
        clearedMemberships: duesList.filter(d => d.outstandingAmount === 0).length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Collect / settle outstanding payment on a membership
// @route   POST /api/dues/:id/pay
const settleDuesPayment = async (req, res) => {
  try {
    const membershipId = req.params.id;
    const { amount, paymentMethod = 'UPI', notes } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    const membership = await Membership.findById(membershipId).populate('plan').populate('member');
    if (!membership) return res.status(404).json({ success: false, message: 'Membership not found' });

    const payAmount = Number(amount);
    const timestampStr = Date.now().toString().slice(-6);
    const invoiceNo = `INV-DUE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create payment
    const payment = await Payment.create({
      member: membership.member._id,
      membership: membership._id,
      amount: payAmount,
      paymentMethod,
      transactionId: `TXN-DUES-${timestampStr}`,
      invoiceNo,
      status: 'Completed',
      isDemoPayment: true,
      notes: notes || `Settlement of dues for ${membership.plan?.name}`
    });

    // Create invoice
    await Invoice.create({
      invoiceNumber: invoiceNo,
      member: membership.member._id,
      payment: payment._id,
      membership: membership._id,
      planName: membership.plan?.name || 'Membership Dues',
      subTotal: payAmount,
      totalAmount: payAmount,
      status: 'Paid'
    });

    // Re-calculate dues
    const allPayments = await Payment.find({ membership: membership._id, status: 'Completed' });
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const price = membership.priceSnapshot || membership.plan.price;
    const remaining = Math.max(0, price - totalPaid);

    membership.amountPaid = totalPaid;
    membership.outstandingDues = remaining;
    membership.paymentStatus = remaining === 0 ? 'Paid' : 'Partial';
    if (membership.status === 'Pending Payment' && remaining === 0) {
      membership.status = 'Active';
    }
    await membership.save();

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'DUES_PAYMENT_COLLECTED',
      entity: 'Payment',
      entityId: payment._id,
      newValues: { amount: payAmount, remainingDues: remaining },
      details: `Collected ₹${payAmount} dues from ${membership.member?.memberCustomId}`
    });

    res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmount} recorded successfully! Remaining dues: ₹${remaining}`,
      data: {
        payment,
        totalPaid,
        remainingDues: remaining,
        paymentStatus: membership.paymentStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDuesAndDefaulters,
  settleDuesPayment
};
