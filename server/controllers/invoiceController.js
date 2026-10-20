const Invoice = require('../models/Invoice');
const Member = require('../models/Member');

/**
 * DBMS LAB CONCEPT - Invoice Controller:
 * Retrieves financial invoices linked to payments and memberships.
 */

// @desc    Get all invoices or member invoices
// @route   GET /api/invoices
const getInvoices = async (req, res) => {
  try {
    const { memberId } = req.query;
    let filter = {};

    if (memberId) filter.member = memberId;
    if (req.user.role === 'Member') {
      const member = await Member.findOne({ user: req.user._id });
      if (member) filter.member = member._id;
    }

    const invoices = await Invoice.find(filter)
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate('payment')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name email phone address' }
      })
      .populate('payment');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById
};
