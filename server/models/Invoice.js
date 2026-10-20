const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Invoicing & Financial Accounting:
 * Links Payments to official gym invoices with tax, discount snapshots, and printable records.
 */
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true // e.g. "INV-2026-0001"
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  membership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership'
  },
  planName: {
    type: String,
    required: true
  },
  subTotal: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending', 'Cancelled', 'Refunded'],
    default: 'Paid'
  },
  issuedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);
