const Member = require('../models/Member');
const User = require('../models/User');
const Membership = require('../models/Membership');

/**
 * DBMS LAB CONCEPT - Member Management Operations:
 * Demonstrates CRUD, Complex Querying (Search, Regex, Pagination, Filter), and Population.
 */

/**
 * @desc    Get all members with search, filter, sort & pagination
 * @route   GET /api/members
 * @access  Private (Admin, Trainer)
 */
const getMembers = async (req, res) => {
  try {
    const { search, status, trainer, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = req.query;

    let userSearchQuery = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      userSearchQuery = {
        $or: [
          { name: regex },
          { email: regex },
          { phone: regex }
        ]
      };
    }

    // Find users matching search criteria
    const matchingUsers = await User.find(userSearchQuery).select('_id');
    const userIds = matchingUsers.map(u => u._id);

    // Build Member match criteria
    let memberFilter = {};
    
    if (search) {
      memberFilter.$or = [
        { user: { $in: userIds } },
        { memberCustomId: new RegExp(search, 'i') }
      ];
    }

    if (status && status !== 'All') {
      memberFilter.status = status;
    }

    if (trainer && trainer !== 'All') {
      memberFilter.assignedTrainer = trainer;
    }

    // Calculate pagination skip
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Sort order
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // DBMS LAB QUERY: Mongoose find with populate and pagination
    const totalMembers = await Member.countDocuments(memberFilter);
    const members = await Member.find(memberFilter)
      .populate('user', 'name email phone avatar role')
      .populate({
        path: 'assignedTrainer',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate({
        path: 'currentMembership',
        populate: { path: 'plan', select: 'name durationMonths price' }
      })
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: members,
      pagination: {
        total: totalMembers,
        page: pageNum,
        pages: Math.ceil(totalMembers / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single member details with full history
 * @route   GET /api/members/:id
 * @access  Private
 */
const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
      .populate('user', 'name email phone avatar createdAt')
      .populate({
        path: 'assignedTrainer',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate({
        path: 'currentMembership',
        populate: { path: 'plan' }
      });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create new member (Admin action)
 * @route   POST /api/members
 * @access  Private (Admin)
 */
const createMember = async (req, res) => {
  try {
    const { name, email, password, phone, gender, dob, emergencyContact, address, assignedTrainer } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Create User record
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: password || 'Member@123',
      phone: phone || '',
      role: 'Member'
    });

    const count = await Member.countDocuments();
    const memberCustomId = `GF-${1001 + count}`;

    // Create Member record
    const member = await Member.create({
      user: user._id,
      memberCustomId,
      gender: gender || 'Male',
      dob,
      emergencyContact,
      address,
      assignedTrainer: assignedTrainer || null,
      status: 'Active'
    });

    const populatedMember = await Member.findById(member._id)
      .populate('user', 'name email phone')
      .populate({
        path: 'assignedTrainer',
        populate: { path: 'user', select: 'name' }
      });

    res.status(201).json({ success: true, data: populatedMember });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update member details
 * @route   PUT /api/members/:id
 * @access  Private (Admin)
 */
const updateMember = async (req, res) => {
  try {
    const { name, phone, gender, dob, emergencyContact, address, assignedTrainer, status } = req.body;

    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Update user details
    if (name || phone) {
      await User.findByIdAndUpdate(member.user, {
        ...(name && { name }),
        ...(phone && { phone })
      });
    }

    // Update member details
    member.gender = gender || member.gender;
    member.dob = dob || member.dob;
    member.emergencyContact = emergencyContact !== undefined ? emergencyContact : member.emergencyContact;
    member.address = address !== undefined ? address : member.address;
    member.assignedTrainer = assignedTrainer !== undefined ? (assignedTrainer || null) : member.assignedTrainer;
    member.status = status || member.status;

    await member.save();

    const updatedMember = await Member.findById(member._id)
      .populate('user', 'name email phone')
      .populate({
        path: 'assignedTrainer',
        populate: { path: 'user', select: 'name' }
      })
      .populate({
        path: 'currentMembership',
        populate: { path: 'plan' }
      });

    res.json({ success: true, data: updatedMember });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete member & linked user
 * @route   DELETE /api/members/:id
 * @access  Private (Admin)
 */
const deleteMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Cascade delete linked user
    await User.findByIdAndDelete(member.user);
    await Member.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
};
