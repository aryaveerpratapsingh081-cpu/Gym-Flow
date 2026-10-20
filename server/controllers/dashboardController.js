const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const Membership = require('../models/Membership');
const Plan = require('../models/Plan');
const Workout = require('../models/Workout');
const Progress = require('../models/Progress');
const Class = require('../models/Class');
const ClassBooking = require('../models/ClassBooking');
const TrainingSession = require('../models/TrainingSession');
const Equipment = require('../models/Equipment');
const DietPlan = require('../models/DietPlan');
const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Aggregation Pipeline Dashboard Controller:
 * Showcases advanced MongoDB aggregation operators:
 * 1. $match (Filtering documents)
 * 2. $group (Grouping & Summing financial revenue / counting attendance)
 * 3. $lookup (Joining documents across collections - Member & Plan, Trainer & User)
 * 4. $project (Formatting aggregated output fields)
 * 5. $sort (Sorting time-series chart data)
 */

/**
 * @desc    Get Admin Dashboard Stats & Chart Data
 * @route   GET /api/dashboard/admin
 * @access  Private (Admin)
 */
const getAdminDashboard = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // 1. Total Members
    const totalMembers = await Member.countDocuments();
    const activeMembers = await Member.countDocuments({ status: 'Active' });
    const activeMemberships = await Membership.countDocuments({ status: 'Active' });

    // 2. Total Trainers
    const totalTrainers = await Trainer.countDocuments({ status: 'Active' });

    // 3. Monthly Revenue using MongoDB $group & $sum aggregation
    const monthlyRevenueAgg = await Payment.aggregate([
      {
        $match: {
          status: 'Completed',
          paymentDate: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;

    // 4. Today's Attendance
    const todayAttendance = await Attendance.countDocuments({ date: todayStr });

    // 5. Expiring Memberships (within 7 days)
    const today = new Date();
    const inSevenDays = new Date();
    inSevenDays.setDate(today.getDate() + 7);

    const expiringMemberships = await Membership.find({
      status: { $in: ['Active', 'Expiring Soon'] },
      endDate: { $gte: today, $lte: inSevenDays }
    })
    .populate({
      path: 'member',
      populate: { path: 'user', select: 'name email phone' }
    })
    .populate('plan', 'name')
    .sort({ endDate: 1 })
    .limit(5);

    // 6. Outstanding Dues Aggregation
    const membershipsWithDues = await Membership.find({ status: { $ne: 'Cancelled' } });
    let totalOutstandingDues = 0;
    membershipsWithDues.forEach(m => {
      totalOutstandingDues += (m.outstandingDues || 0);
    });

    // 7. Equipment requiring maintenance
    const equipmentDueCount = await Equipment.countDocuments({
      $or: [
        { nextServiceDate: { $lte: inSevenDays } },
        { condition: { $in: ['Needs Maintenance', 'Out of Order'] } }
      ]
    });

    // 8. Upcoming Classes count
    const upcomingClassesCount = await Class.countDocuments({
      status: 'Scheduled',
      startTime: { $gte: today }
    });

    // -------------------------------------------------------------
    // CHARTS DATA via MongoDB Aggregation Pipelines
    // -------------------------------------------------------------

    // CHART 1: Monthly Revenue for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyRevenueChartAgg = await Payment.aggregate([
      {
        $match: {
          status: 'Completed',
          paymentDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          revenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenueChart = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mNum = d.getMonth() + 1;
      const yNum = d.getFullYear();
      
      const match = monthlyRevenueChartAgg.find(item => item._id.year === yNum && item._id.month === mNum);
      monthlyRevenueChart.push({
        month: `${monthNames[mNum - 1]} ${yNum}`,
        revenue: match ? match.revenue : 0
      });
    }

    // CHART 2: Attendance for last 7 days
    const attendanceChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = await Attendance.countDocuments({ date: dateStr });
      attendanceChart.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        count
      });
    }

    // CHART 3: Membership Plan Distribution using $lookup and $group
    const membershipDistributionAgg = await Membership.aggregate([
      { $match: { status: 'Active' } },
      {
        $lookup: {
          from: 'plans',
          localField: 'plan',
          foreignField: '_id',
          as: 'planDetails'
        }
      },
      { $unwind: '$planDetails' },
      {
        $group: {
          _id: '$planDetails.name',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          count: 1
        }
      }
    ]);

    // CHART 4: Trainer-wise Member Allocation ($group & $lookup)
    const trainerDistributionAgg = await Member.aggregate([
      { $match: { assignedTrainer: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTrainer',
          memberCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'trainers',
          localField: '_id',
          foreignField: '_id',
          as: 'trainer'
        }
      },
      { $unwind: '$trainer' },
      {
        $lookup: {
          from: 'users',
          localField: 'trainer.user',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          trainerName: '$user.name',
          count: '$memberCount'
        }
      }
    ]);

    // Recent Payments
    const recentPayments = await Payment.find({ status: 'Completed' })
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ paymentDate: -1 })
      .limit(5);

    // Recent Registrations
    const recentMembers = await Member.find()
      .populate('user', 'name email phone avatar')
      .populate({ path: 'currentMembership', populate: { path: 'plan' } })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalMembers,
          activeMembers,
          activeMemberships,
          totalTrainers,
          monthlyRevenue,
          todayAttendance,
          expiringCount: expiringMemberships.length,
          totalOutstandingDues,
          equipmentDueCount,
          upcomingClassesCount
        },
        expiringMemberships,
        recentPayments,
        recentMembers,
        charts: {
          monthlyRevenue: monthlyRevenueChart,
          attendance: attendanceChart,
          membershipDistribution: membershipDistributionAgg,
          trainerDistribution: trainerDistributionAgg
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Trainer Dashboard Stats
 * @route   GET /api/dashboard/trainer
 * @access  Private (Trainer)
 */
const getTrainerDashboard = async (req, res) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer profile not found' });
    }

    const assignedMembers = await Member.find({ assignedTrainer: trainer._id })
      .populate('user', 'name email phone avatar')
      .populate({ path: 'currentMembership', populate: { path: 'plan' } });

    const memberIds = assignedMembers.map(m => m._id);

    // Today's attendance for assigned members
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAttendanceCount = await Attendance.countDocuments({
      member: { $in: memberIds },
      date: todayStr
    });

    // Active workouts count
    const activeWorkoutsCount = await Workout.countDocuments({
      trainer: trainer._id,
      status: 'Active'
    });

    // Active Diet Plans count
    const activeDietPlansCount = await DietPlan.countDocuments({
      trainer: trainer._id,
      status: 'Active'
    });

    // Upcoming 1-on-1 personal training sessions
    const upcomingSessions = await TrainingSession.find({
      trainer: trainer._id,
      startTime: { $gte: new Date() },
      status: 'Scheduled'
    })
    .populate({
      path: 'member',
      populate: { path: 'user', select: 'name email phone avatar' }
    })
    .sort({ startTime: 1 })
    .limit(5);

    // Upcoming Group Classes assigned to this trainer
    const upcomingClasses = await Class.find({
      trainer: trainer._id,
      startTime: { $gte: new Date() },
      status: 'Scheduled'
    }).sort({ startTime: 1 }).limit(5);

    // Members requiring progress update (no update in last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const membersNeedingProgress = [];
    for (const mem of assignedMembers) {
      const recentProgress = await Progress.findOne({ member: mem._id, date: { $gte: fourteenDaysAgo } });
      if (!recentProgress) {
        membersNeedingProgress.push(mem);
      }
    }

    // Recent progress logs for assigned members
    const recentProgressLogs = await Progress.find({ member: { $in: memberIds } })
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name avatar' }
      })
      .sort({ date: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          assignedMembersCount: assignedMembers.length,
          todayAttendanceCount,
          activeWorkoutsCount,
          activeDietPlansCount,
          needingProgressCount: membersNeedingProgress.length,
          upcomingSessionsCount: upcomingSessions.length
        },
        assignedMembers,
        upcomingSessions,
        upcomingClasses,
        recentProgressLogs,
        membersNeedingProgress: membersNeedingProgress.slice(0, 5)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Member Dashboard Stats & Details
 * @route   GET /api/dashboard/member
 * @access  Private (Member)
 */
const getMemberDashboard = async (req, res) => {
  try {
    const member = await Member.findOne({ user: req.user._id })
      .populate('user', 'name email phone avatar')
      .populate({
        path: 'assignedTrainer',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate({
        path: 'currentMembership',
        populate: { path: 'plan' }
      });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member profile not found' });
    }

    // Days remaining in membership
    let daysRemaining = 0;
    if (member.currentMembership && member.currentMembership.endDate) {
      const diffMs = new Date(member.currentMembership.endDate) - new Date();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Attendance stats
    const attendanceRecords = await Attendance.find({ member: member._id }).sort({ date: -1 });
    const totalVisits = attendanceRecords.length;

    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    const monthVisits = attendanceRecords.filter(r => r.date.startsWith(currentMonthPrefix)).length;

    // Active workout plan
    const activeWorkout = await Workout.findOne({ member: member._id, status: 'Active' });

    // Active Diet plan
    const activeDietPlan = await DietPlan.findOne({ member: member._id, status: 'Active' });

    // Progress stats
    const progressRecords = await Progress.find({ member: member._id }).sort({ date: 1 });
    const latestProgress = progressRecords.length > 0 ? progressRecords[progressRecords.length - 1] : null;

    // Upcoming booked classes
    const upcomingBookings = await ClassBooking.find({ member: member._id, status: 'Booked' })
      .populate({
        path: 'class',
        populate: { path: 'trainer', populate: { path: 'user', select: 'name' } }
      })
      .sort({ createdAt: -1 })
      .limit(3);

    // Upcoming personal training sessions
    const upcomingSessions = await TrainingSession.find({
      member: member._id,
      startTime: { $gte: new Date() },
      status: 'Scheduled'
    })
    .populate({
      path: 'trainer',
      populate: { path: 'user', select: 'name email phone' }
    })
    .sort({ startTime: 1 })
    .limit(3);

    // Recent Payments
    const payments = await Payment.find({ member: member._id })
      .sort({ paymentDate: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        member,
        membership: {
          card: member.currentMembership,
          daysRemaining
        },
        attendance: {
          totalVisits,
          monthVisits,
          percentage: Math.min(100, Math.round((monthVisits / 25) * 100)),
          recentLogs: attendanceRecords.slice(0, 5)
        },
        workout: activeWorkout,
        dietPlan: activeDietPlan,
        progress: {
          records: progressRecords,
          latest: latestProgress
        },
        upcomingBookings,
        upcomingSessions,
        payments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminDashboard,
  getTrainerDashboard,
  getMemberDashboard
};
