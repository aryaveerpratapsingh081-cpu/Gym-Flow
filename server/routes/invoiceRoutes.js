const express = require('express');
const router = express.Router();
const { getInvoices, getInvoiceById } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);

module.exports = router;
