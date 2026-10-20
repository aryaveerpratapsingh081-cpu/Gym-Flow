const mongoose = require('mongoose');
const User = require('../models/User');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const Membership = require('../models/Membership');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Plan = require('../models/Plan');
const Workout = require('../models/Workout');
const Progress = require('../models/Progress');
const Class = require('../models/Class');
const Equipment = require('../models/Equipment');
const Locker = require('../models/Locker');
const Coupon = require('../models/Coupon');
const Lead = require('../models/Lead');
const Feedback = require('../models/Feedback');
const AuditLog = require('../models/AuditLog');
const CheckInToken = require('../models/CheckInToken');
const { getDbStatus } = require('../config/db');

/**
 * DBMS LAB CONCEPT - DBMS Diagnostics & SQL View Equivalent:
 * Demonstrates:
 * 1. Schema & Index Introspection: Lists active B-Tree, Compound, Unique, and TTL indexes.
 * 2. SQL View Equivalent: Aggregation pipeline functioning as a virtual table / view.
 * 3. Collection statistics and execution diagnostics for faculty viva review.
 */

// @desc    Get complete DBMS Lab Diagnostics (Index catalog, collection stats, engine health)
// @route   GET /api/reports/dbms-diagnostics
const getDbmsDiagnostics = async (req, res) => {
  try {
    const dbStatus = getDbStatus ? getDbStatus() : { isConnected: true, type: 'MongoDB' };

    // Inspect Indexes across key collections
    const collectionsToInspect = [
      { name: 'Users', model: User },
      { name: 'Members', model: Member },
      { name: 'Trainers', model: Trainer },
      { name: 'Memberships', model: Membership },
      { name: 'Attendance', model: Attendance },
      { name: 'Payments', model: Payment },
      { name: 'CheckInTokens (TTL)', model: CheckInToken },
      { name: 'Classes', model: Class },
      { name: 'Lockers', model: Locker },
      { name: 'Coupons', model: Coupon },
      { name: 'AuditLogs', model: AuditLog }
    ];

    const indexCatalog = await Promise.all(collectionsToInspect.map(async (c) => {
      try {
        const indexes = await c.model.collection.indexes();
        const docCount = await c.model.countDocuments();
        return {
          collection: c.name,
          documentCount: docCount,
          indexes: indexes.map(idx => ({
            name: idx.name,
            key: idx.key,
            unique: Boolean(idx.unique),
            expireAfterSeconds: idx.expireAfterSeconds !== undefined ? idx.expireAfterSeconds : null
          }))
        };
      } catch (err) {
        return {
          collection: c.name,
          documentCount: 0,
          indexes: []
        };
      }
    }));

    // Concept Viva Explanations
    const vivaConcepts = {
      indexing: {
        title: 'B-Tree & Compound Indexing',
        explanation: 'MongoDB stores indexes as B-Trees. Without an index, MongoDB must execute a COLLSCAN (Full Collection Scan) reading every document from disk. With an index (e.g. email: 1 or compound member + date: 1), lookup complexity drops from O(N) to O(log N). Compound unique indexes also enforce business constraints at the database engine level.',
        keyIndexesInProject: [
          'Attendance: { member: 1, date: 1 } (UNIQUE - Prevents duplicate daily attendance)',
          'User: { email: 1 } (UNIQUE - Fast O(1) auth)',
          'CheckInToken: { expiresAt: 1 } (TTL - 300s automatic document eviction)',
          'Payment: { transactionId: 1 } (UNIQUE - Double charge prevention)',
          'Locker: { lockerNumber: 1 } (UNIQUE - Double allocation prevention)'
        ]
      },
      sqlVsMongo: {
        title: 'SQL vs MongoDB Relational Mapping',
        explanation: 'In SQL (e.g. MySQL/Postgres), relations are enforced by foreign key constraints with strict referential integrity. In MongoDB, relationships are maintained via ObjectId references (Document Referencing) and combined with embedded subdocuments (Denormalization) where high-read performance is required. $lookup provides left-outer-join aggregation equivalent.',
        equivalents: [
          { sql: 'TABLE (Rows & Columns)', mongo: 'COLLECTION (JSON / BSON Documents)' },
          { sql: 'FOREIGN KEY & JOIN', mongo: 'ObjectId Reference & $lookup pipeline' },
          { sql: 'CREATE VIEW ... AS SELECT', mongo: 'Aggregation Pipeline / Read-only Virtual View' },
          { sql: 'ACID Transactions (BEGIN/COMMIT)', mongo: 'Multi-Document Session Transactions & Atomic Operators' }
        ]
      }
    };

    res.json({
      success: true,
      data: {
        databaseStatus: dbStatus,
        indexCatalog,
        vivaConcepts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    SQL View Equivalent - Monthly Revenue & Financial Summary View
// @route   GET /api/reports/monthly-revenue-view
const getMonthlyRevenueView = async (req, res) => {
  try {
    /**
     * DBMS LAB CONCEPT - SQL View Equivalent via Aggregation Pipeline:
     * SQL Equivalent:
     *   CREATE VIEW monthly_revenue_view AS
     *   SELECT
     *     strftime('%Y-%m', paymentDate) AS monthYear,
     *     SUM(amount) AS totalRevenue,
     *     COUNT(*) AS transactionCount,
     *     AVG(amount) AS averageTransactionValue
     *   FROM payments
     *   WHERE status = 'Completed'
     *   GROUP BY monthYear
     *   ORDER BY monthYear DESC;
     */
    const revenueViewAgg = await Payment.aggregate([
      {
        $match: {
          status: 'Completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          averageTransactionValue: { $avg: '$amount' },
          minTransaction: { $min: '$amount' },
          maxTransaction: { $max: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          period: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' }
                ]
              }
            ]
          },
          totalRevenue: 1,
          transactionCount: 1,
          averageTransactionValue: { $round: ['$averageTransactionValue', 2] },
          minTransaction: 1,
          maxTransaction: 1
        }
      },
      {
        $sort: { period: -1 }
      }
    ]);

    res.json({
      success: true,
      viewName: 'MonthlyRevenueAggregationView',
      sqlEquivalentQuery: `SELECT strftime('%Y-%m', paymentDate) AS period, SUM(amount) AS totalRevenue, COUNT(*) AS transactionCount, AVG(amount) AS avgTx FROM payments WHERE status = 'Completed' GROUP BY period ORDER BY period DESC;`,
      rowCount: revenueViewAgg.length,
      data: revenueViewAgg
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDbmsDiagnostics,
  getMonthlyRevenueView
};
