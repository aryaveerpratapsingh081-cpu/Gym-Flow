const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', authorize('Admin'), getAuditLogs);

module.exports = router;
