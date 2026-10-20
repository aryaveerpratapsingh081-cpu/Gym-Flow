const AuditLog = require('../models/AuditLog');

/**
 * DBMS LAB CONCEPT - Audit Log Controller (Read-Only Compliance Trail):
 * Demonstrates:
 * 1. Read-only retrieval (no PUT/DELETE endpoints exist on this resource)
 * 2. Secondary index scan on `{ entity: 1, createdAt: -1 }`
 * 3. System change observability and auditing
 */

// @desc    Get audit trail with entity/action filters
// @route   GET /api/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const { entity, action, limit = 50 } = req.query;
    let filter = {};

    if (entity && entity !== 'All') filter.entity = entity;
    if (action && action !== 'All') filter.action = action;

    const logs = await AuditLog.find(filter)
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const totalCount = await AuditLog.countDocuments();

    res.json({
      success: true,
      data: logs,
      totalCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAuditLogs
};
