const Locker = require('../models/Locker');
const Member = require('../models/Member');
const logAudit = require('../utils/auditLogger');

/**
 * DBMS LAB CONCEPT - Locker Allocation & Concurrency-Safe Atomic Updates:
 * Demonstrates:
 * 1. Atomic compare-and-swap via `findOneAndUpdate({ _id, status: 'Available' }, ...)`
 *    Prevents double allocation race conditions across simultaneous booking requests.
 * 2. Status state transitions: 'Available' <-> 'Allocated' <-> 'Under Maintenance'
 * 3. Cascade audit logging
 */

// @desc    Get all lockers with zone/status filter
// @route   GET /api/lockers
const getLockers = async (req, res) => {
  try {
    const { zone, status } = req.query;
    let filter = {};
    if (zone && zone !== 'All') filter.zone = zone;
    if (status && status !== 'All') filter.status = status;

    const lockers = await Locker.find(filter)
      .populate({
        path: 'assignedMember',
        populate: { path: 'user', select: 'name email phone' }
      })
      .sort({ lockerNumber: 1 });

    const total = await Locker.countDocuments();
    const available = await Locker.countDocuments({ status: 'Available' });
    const allocated = await Locker.countDocuments({ status: 'Allocated' });

    res.json({
      success: true,
      data: lockers,
      stats: { total, available, allocated }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Allocate a locker to a member (Atomic Concurrency-Safe)
// @route   POST /api/lockers/:id/allocate
const allocateLocker = async (req, res) => {
  try {
    const lockerId = req.params.id;
    const { memberId, releaseDays = 30 } = req.body;

    if (!memberId) {
      return res.status(400).json({ success: false, message: 'Member ID is required for locker allocation' });
    }

    const member = await Member.findById(memberId).populate('user', 'name');
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Check if member already has an allocated locker
    const existingLocker = await Locker.findOne({ assignedMember: memberId, status: 'Allocated' });
    if (existingLocker) {
      return res.status(400).json({
        success: false,
        message: `${member.user.name} already has Locker ${existingLocker.lockerNumber} allocated.`
      });
    }

    const allocationDate = new Date();
    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + Number(releaseDays));

    // ATOMIC OPERATION: Update ONLY if status is 'Available'
    const locker = await Locker.findOneAndUpdate(
      {
        _id: lockerId,
        status: 'Available'
      },
      {
        $set: {
          status: 'Allocated',
          assignedMember: memberId,
          allocationDate,
          releaseDate
        }
      },
      { new: true }
    ).populate({
      path: 'assignedMember',
      populate: { path: 'user', select: 'name email phone' }
    });

    if (!locker) {
      return res.status(400).json({
        success: false,
        conflict: true,
        message: 'This locker is no longer available or is currently under maintenance. Double allocation prevented.'
      });
    }

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name || 'Staff',
      actorRole: req.user?.role || 'Admin',
      action: 'LOCKER_ALLOCATED',
      entity: 'Locker',
      entityId: locker._id,
      newValues: {
        lockerNumber: locker.lockerNumber,
        assignedMember: member.user.name,
        releaseDate
      },
      details: `Locker ${locker.lockerNumber} allocated to ${member.user.name} until ${releaseDate.toLocaleDateString()}`
    });

    res.json({
      success: true,
      message: `Locker ${locker.lockerNumber} allocated successfully to ${member.user.name}!`,
      data: locker
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Release / De-allocate locker
// @route   POST /api/lockers/:id/release
const releaseLocker = async (req, res) => {
  try {
    const locker = await Locker.findById(req.params.id);
    if (!locker) {
      return res.status(404).json({ success: false, message: 'Locker not found' });
    }

    const previousMember = locker.assignedMember;
    locker.status = 'Available';
    locker.assignedMember = null;
    locker.allocationDate = null;
    locker.releaseDate = null;
    await locker.save();

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'LOCKER_RELEASED',
      entity: 'Locker',
      entityId: locker._id,
      details: `Locker ${locker.lockerNumber} returned to Available pool`
    });

    res.json({ success: true, message: `Locker ${locker.lockerNumber} has been released and is now available.`, data: locker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLockers,
  allocateLocker,
  releaseLocker
};
