const AuditLog = require('../models/AuditLog');

/**
 * DBMS LAB HELPER - Write an immutable audit log entry
 */
const logAudit = async ({
  actor = null,
  actorName = 'System',
  actorRole = 'System',
  action,
  entity,
  entityId = null,
  oldValues = null,
  newValues = null,
  details = '',
  ipAddress = '127.0.0.1'
}) => {
  try {
    await AuditLog.create({
      actor: actor?._id || actor || null,
      actorName: actor?.name || actorName,
      actorRole: actor?.role || actorRole,
      action,
      entity,
      entityId,
      oldValues,
      newValues,
      details,
      ipAddress
    });
  } catch (err) {
    console.error(`⚠️ Failed to record audit log (${action}):`, err.message);
  }
};

module.exports = logAudit;
