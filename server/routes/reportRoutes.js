const express = require('express');
const router = express.Router();
const {
  getDbmsDiagnostics,
  getMonthlyRevenueView
} = require('../controllers/diagnosticController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/diagnostics', authorize('Admin'), getDbmsDiagnostics);
router.get('/dbms-diagnostics', authorize('Admin'), getDbmsDiagnostics);
router.get('/monthly-revenue-view', authorize('Admin'), getMonthlyRevenueView);

module.exports = router;
