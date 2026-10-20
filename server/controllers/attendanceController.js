const Attendance = require('../models/Attendance');
const Member = require('../models/Member');
const User = require('../models/User');
const CheckInToken = require('../models/CheckInToken');
const Membership = require('../models/Membership');
const crypto = require('crypto');
const logAudit = require('../utils/auditLogger');

/**
 * DBMS LAB CONCEPT - Attendance Controller & Secure QR Tokens:
 * Demonstrates:
 * 1. Compound Unique Indexing (`{ member, date }`) to prevent duplicate daily check-ins at DB engine level
 * 2. 5-Minute TTL Index on CheckInToken with server-side timestamp expiry and single-use replay prevention
 * 3. Atomic check-in recording and attendance percentage aggregation
 */

// Format current date as YYYY-MM-DD
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

// Format current time as HH:MM AM/PM
const getCurrentTimeString = () => {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

/**
 * @desc    Generate a secure 5-minute QR check-in token for a member
 * @route   POST /api/attendance/token/generate
 * @access  Private (Member / Admin)
 */
const generateCheckInToken = async (req, res) => {
  try {
    let memberId = req.body.memberId;

    if (!memberId) {
      const member = await Member.findOne({ user: req.user._id });
      if (!member) {
        return res.status(404).json({ success: false, message: 'Member profile not found' });
      }
      memberId = member._id;
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // 5-minute lifetime (300 seconds)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const token = `GF-QR-${crypto.randomBytes(16).toString('hex')}`;

    const tokenDoc = await CheckInToken.create({
      member: member._id,
      token,
      expiresAt,
      isUsed: false
    });

    res.status(201).json({
      success: true,
      data: {
        token: tokenDoc.token,
        memberCustomId: member.memberCustomId,
        expiresAt: tokenDoc.expiresAt,
        validForSeconds: 300
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Verify QR token & check in member (with single-use & TTL check)
 * @route   POST /api/attendance/token/verify
 * @access  Private (Admin, Trainer, Kiosk)
 */
const verifyCheckInToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'QR check-in token is required' });
    }

    // 1. Look up token in database
    const tokenDoc = await CheckInToken.findOne({ token }).populate({
      path: 'member',
      populate: [
        { path: 'user', select: 'name email phone avatar' },
        { path: 'currentMembership', populate: { path: 'plan', select: 'name durationMonths' } }
      ]
    });

    if (!tokenDoc) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or unknown QR token. Please refresh your QR pass.'
      });
    }

    // 2. Replay Prevention: Check if token has already been consumed
    if (tokenDoc.isUsed) {
      return res.status(400).json({
        success: false,
        replayPrevented: true,
        message: `Security Alert: This QR token was already used at ${tokenDoc.usedAt ? tokenDoc.usedAt.toLocaleTimeString() : 'earlier'}. Please generate a fresh token.`
      });
    }

    // 3. Strict Server-side Expiration Check (MongoDB TTL deletes asynchronously)
    if (new Date() > new Date(tokenDoc.expiresAt)) {
      return res.status(400).json({
        success: false,
        expired: true,
        message: 'This QR code has expired (exceeded 5-minute validity). Please generate a new QR pass.'
      });
    }

    const member = tokenDoc.member;
    if (!member) {
      return res.status(404).json({ success: false, message: 'Associated member record missing' });
    }

    // 4. Validate Membership Status
    if (member.status === 'Cancelled' || member.status === 'Expired') {
      return res.status(403).json({
        success: false,
        message: `Access Denied: Member status is ${member.status}. Please renew membership.`
      });
    }

    const todayStr = getTodayString();
    const checkInTime = getCurrentTimeString();

    // 5. Check if attendance already marked today
    const existing = await Attendance.findOne({ member: member._id, date: todayStr });
    if (existing) {
      // Invalidate the token to prevent reuse attempts
      tokenDoc.isUsed = true;
      tokenDoc.usedAt = new Date();
      await tokenDoc.save();

      return res.status(400).json({
        success: false,
        alreadyCheckedIn: true,
        message: `${member.user.name} is ALREADY checked in for today at ${existing.checkInTime}.`,
        data: existing
      });
    }

    // 6. Atomically invalidate token
    tokenDoc.isUsed = true;
    tokenDoc.usedAt = new Date();
    await tokenDoc.save();

    // 7. Record Attendance
    const attendance = await Attendance.create({
      member: member._id,
      date: todayStr,
      checkInTime,
      status: 'Present',
      markedBy: req.user ? req.user._id : null
    });

    await logAudit({
      actor: req.user ? req.user._id : null,
      actorName: req.user ? req.user.name : 'QR Kiosk Scanner',
      actorRole: req.user ? req.user.role : 'System',
      action: 'QR_CHECK_IN_SUCCESS',
      entity: 'Attendance',
      entityId: attendance._id,
      details: `Member ${member.user.name} (${member.memberCustomId}) checked in via 5-min verified QR token`
    });

    res.status(201).json({
      success: true,
      message: `Verified! Check-in successful for ${member.user.name} (${member.memberCustomId})!`,
      data: {
        attendance,
        member: {
          name: member.user.name,
          email: member.user.email,
          customId: member.memberCustomId,
          plan: member.currentMembership?.plan?.name || 'Active Member',
          checkInTime
        }
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        alreadyCheckedIn: true,
        message: 'Member already checked in today!'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Mark member check-in (Manual or fallback)
 * @route   POST /api/attendance/check-in
 * @access  Private (Admin, Trainer)
 */
const markCheckIn = async (req, res) => {
  try {
    const { memberId, memberCustomId, status = 'Present', customTime } = req.body;

    let member;
    if (memberId) {
      member = await Member.findById(memberId).populate('user', 'name email');
    } else if (memberCustomId) {
      member = await Member.findOne({ memberCustomId: memberCustomId.trim().toUpperCase() }).populate('user', 'name email');
    }

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found. Check Member ID or QR code.' });
    }

    const todayStr = getTodayString();
    const checkInTime = customTime || getCurrentTimeString();

    // Check if attendance already exists for today
    const existingAttendance = await Attendance.findOne({
      member: member._id,
      date: todayStr
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        alreadyCheckedIn: true,
        message: `${member.user.name} (${member.memberCustomId}) is ALREADY checked in for today at ${existingAttendance.checkInTime}.`,
        data: existingAttendance
      });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      member: member._id,
      date: todayStr,
      checkInTime,
      status,
      markedBy: req.user ? req.user._id : null
    });

    const populated = await Attendance.findById(attendance._id)
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name email phone' }
      });

    await logAudit({
      actor: req.user ? req.user._id : null,
      actorName: req.user ? req.user.name : 'Staff',
      actorRole: req.user ? req.user.role : 'Trainer',
      action: 'MANUAL_CHECK_IN_SUCCESS',
      entity: 'Attendance',
      entityId: attendance._id,
      details: `Manual check-in marked for ${member.user.name} (${member.memberCustomId})`
    });

    res.status(201).json({
      success: true,
      message: `Check-in recorded successfully for ${member.user.name}!`,
      data: populated
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        alreadyCheckedIn: true,
        message: 'Member already checked in today!'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Mark member check-out
 * @route   PUT /api/attendance/:id/check-out
 * @access  Private (Admin, Trainer)
 */
const markCheckOut = async (req, res) => {
  try {
    const { customTime } = req.body;
    const checkOutTime = customTime || getCurrentTimeString();

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    attendance.checkOutTime = checkOutTime;
    await attendance.save();

    res.json({ success: true, message: 'Check-out recorded successfully', data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get attendance records with date & member filters
 * @route   GET /api/attendance
 * @access  Private
 */
const getAttendance = async (req, res) => {
  try {
    const { date, memberId, search } = req.query;

    let filter = {};

    if (date) {
      filter.date = date;
    } else {
      filter.date = getTodayString();
    }

    if (memberId) {
      filter.member = memberId;
    }

    let records = await Attendance.find(filter)
      .populate({
        path: 'member',
        populate: [
          { path: 'user', select: 'name email phone avatar' },
          { path: 'assignedTrainer', populate: { path: 'user', select: 'name' } }
        ]
      })
      .sort({ createdAt: -1 });

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      records = records.filter(r => 
        r.member && r.member.user && (
          searchRegex.test(r.member.user.name) ||
          searchRegex.test(r.member.user.email) ||
          searchRegex.test(r.member.memberCustomId)
        )
      );
    }

    // Attendance stats
    const todayStr = getTodayString();
    const todayCount = await Attendance.countDocuments({ date: todayStr });
    const totalMembersCount = await Member.countDocuments({ status: 'Active' });

    res.json({
      success: true,
      data: records,
      stats: {
        todayCount,
        totalActiveMembers: totalMembersCount,
        attendancePercentage: totalMembersCount > 0 ? Math.round((todayCount / totalMembersCount) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get attendance history & percentage for a specific member
 * @route   GET /api/attendance/member/:memberId
 * @access  Private
 */
const getMemberAttendanceStats = async (req, res) => {
  try {
    const { memberId } = req.params;

    const records = await Attendance.find({ member: memberId }).sort({ date: -1 });
    const totalVisits = records.length;

    // Current month visits
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthVisits = records.filter(r => r.date.startsWith(currentMonthPrefix)).length;

    // Calculate percentage (assuming ~25 gym days per month)
    const attendancePercentage = Math.min(100, Math.round((currentMonthVisits / 25) * 100));

    res.json({
      success: true,
      data: records,
      stats: {
        totalVisits,
        currentMonthVisits,
        attendancePercentage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  markCheckIn,
  markCheckOut,
  getAttendance,
  getMemberAttendanceStats,
  generateCheckInToken,
  verifyCheckInToken
};
