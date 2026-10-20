const Class = require('../models/Class');
const ClassBooking = require('../models/ClassBooking');
const Member = require('../models/Member');
const logAudit = require('../utils/auditLogger');

/**
 * DBMS LAB CONCEPT - Group Classes & Concurrency-Safe Booking:
 * Demonstrates:
 * 1. Atomic Operations: Uses `{ bookedCount: { $lt: classDoc.capacity } }` and `$inc: { bookedCount: 1 }`
 *    to prevent overbooking under high concurrent load!
 * 2. Compound Unique Index: Prevents a member from booking the same class twice at DB level.
 * 3. Cascade/atomic decrement upon cancellation.
 */

// @desc    Get all classes
// @route   GET /api/classes
const getClasses = async (req, res) => {
  try {
    const { category, status } = req.query;
    let filter = {};
    if (category && category !== 'All') filter.category = category;
    if (status && status !== 'All') filter.status = status;

    const classes = await Class.find(filter)
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name email phone' }
      })
      .sort({ startTime: 1 });

    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new group class
// @route   POST /api/classes
const createClass = async (req, res) => {
  try {
    const { name, trainer, category, startTime, endTime, capacity, location, description } = req.body;

    if (!name || !trainer || !startTime || !endTime || !capacity) {
      return res.status(400).json({ success: false, message: 'Name, trainer, start time, end time, and capacity are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMinutes = Math.max(15, Math.round((end - start) / (1000 * 60)));

    const newClass = await Class.create({
      name,
      trainer,
      category,
      startTime: start,
      endTime: end,
      durationMinutes,
      capacity: Number(capacity),
      bookedCount: 0,
      location: location || 'Studio A',
      description: description || ''
    });

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'Admin',
      action: 'CLASS_CREATED',
      entity: 'Class',
      entityId: newClass._id,
      newValues: { name, category, capacity, startTime: start }
    });

    res.status(201).json({ success: true, data: newClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Book a slot in a group class (Atomic Capacity Increment)
// @route   POST /api/classes/:id/book
const bookClass = async (req, res) => {
  try {
    const classId = req.params.id;
    let memberId = req.body.memberId;

    if (!memberId) {
      const member = await Member.findOne({ user: req.user._id });
      if (!member) {
        return res.status(404).json({ success: false, message: 'Member profile not found' });
      }
      memberId = member._id;
    }

    // Check if member already booked this class
    const existingBooking = await ClassBooking.findOne({ class: classId, member: memberId, status: 'Booked' });
    if (existingBooking) {
      return res.status(400).json({ success: false, message: 'You have already booked a slot in this class' });
    }

    // Fetch class to check capacity limit
    const targetClass = await Class.findById(classId);
    if (!targetClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (targetClass.status !== 'Scheduled') {
      return res.status(400).json({ success: false, message: `Class is currently ${targetClass.status}` });
    }

    // ATOMIC CONCURRENCY CHECK: Increment bookedCount ONLY IF bookedCount < capacity!
    const updatedClass = await Class.findOneAndUpdate(
      {
        _id: classId,
        status: 'Scheduled',
        bookedCount: { $lt: targetClass.capacity }
      },
      { $inc: { bookedCount: 1 } },
      { new: true }
    );

    if (!updatedClass) {
      return res.status(400).json({
        success: false,
        message: 'This class has reached full capacity. No slots available.'
      });
    }

    // Record booking
    const booking = await ClassBooking.create({
      class: classId,
      member: memberId,
      status: 'Booked'
    });

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name || 'Member',
      actorRole: req.user?.role || 'Member',
      action: 'CLASS_BOOKED',
      entity: 'ClassBooking',
      entityId: booking._id,
      details: `Booked slot in ${targetClass.name}. Capacity: ${updatedClass.bookedCount}/${targetClass.capacity}`
    });

    res.status(201).json({
      success: true,
      message: `Slot booked successfully in ${targetClass.name}!`,
      data: {
        booking,
        bookedCount: updatedClass.bookedCount,
        capacity: targetClass.capacity
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You already have an active booking for this class' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a class booking (Atomic Capacity Decrement)
// @route   POST /api/classes/bookings/:id/cancel
const cancelClassBooking = async (req, res) => {
  try {
    const booking = await ClassBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    booking.status = 'Cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    // Atomically decrement class bookedCount (safely min 0)
    await Class.findOneAndUpdate(
      { _id: booking.class, bookedCount: { $gt: 0 } },
      { $inc: { bookedCount: -1 } }
    );

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name || 'Member',
      actorRole: req.user?.role || 'Member',
      action: 'CLASS_BOOKING_CANCELLED',
      entity: 'ClassBooking',
      entityId: booking._id,
      details: `Cancelled class booking and released slot`
    });

    res.json({ success: true, message: 'Booking cancelled successfully. Slot has been freed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings for logged in member or specific member
// @route   GET /api/classes/bookings
const getMemberClassBookings = async (req, res) => {
  try {
    let memberId = req.query.memberId;
    if (!memberId && req.user.role === 'Member') {
      const member = await Member.findOne({ user: req.user._id });
      if (member) memberId = member._id;
    }

    let filter = {};
    if (memberId) filter.member = memberId;

    const bookings = await ClassBooking.find(filter)
      .populate({
        path: 'class',
        populate: { path: 'trainer', populate: { path: 'user', select: 'name' } }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getClasses,
  createClass,
  bookClass,
  cancelClassBooking,
  getMemberClassBookings
};
