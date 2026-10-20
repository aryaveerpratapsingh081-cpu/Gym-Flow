const Equipment = require('../models/Equipment');
const Maintenance = require('../models/Maintenance');
const logAudit = require('../utils/auditLogger');

/**
 * DBMS LAB CONCEPT - Equipment & Predictive Maintenance:
 * Demonstrates:
 * 1. Asset status lifecycle & range filtering (service due within 7 days)
 * 2. Cascaded maintenance log generation
 * 3. Compound indexing on `{ nextServiceDate: 1, condition: 1 }`
 */

// @desc    Get all equipment with category/condition filters and maintenance alerts
// @route   GET /api/equipment
const getEquipment = async (req, res) => {
  try {
    const { category, condition, search } = req.query;
    let filter = {};

    if (category && category !== 'All') filter.category = category;
    if (condition && condition !== 'All') filter.condition = condition;
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const equipmentList = await Equipment.find(filter).sort({ nextServiceDate: 1 });

    const today = new Date();
    const inSevenDays = new Date();
    inSevenDays.setDate(today.getDate() + 7);

    // Calculate metrics
    const overdueCount = await Equipment.countDocuments({ nextServiceDate: { $lt: today } });
    const dueSoonCount = await Equipment.countDocuments({ nextServiceDate: { $gte: today, $lte: inSevenDays } });
    const totalCount = await Equipment.countDocuments();

    res.json({
      success: true,
      data: equipmentList,
      stats: {
        total: totalCount,
        overdue: overdueCount,
        dueWithin7Days: dueSoonCount,
        operational: await Equipment.countDocuments({ condition: { $in: ['Excellent', 'Good'] } })
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add new equipment asset
// @route   POST /api/equipment
const addEquipment = async (req, res) => {
  try {
    const { name, category, serialNumber, condition, location, purchaseDate, nextServiceDate, cost, maintenanceNotes } = req.body;

    if (!name || !nextServiceDate) {
      return res.status(400).json({ success: false, message: 'Name and next service date are required' });
    }

    const item = await Equipment.create({
      name,
      category: category || 'Strength',
      serialNumber: serialNumber || `EQ-${Date.now().toString().slice(-5)}`,
      condition: condition || 'Good',
      location: location || 'Main Floor',
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      lastServiceDate: new Date(),
      nextServiceDate: new Date(nextServiceDate),
      cost: Number(cost) || 0,
      maintenanceNotes: maintenanceNotes || ''
    });

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'EQUIPMENT_ADDED',
      entity: 'Equipment',
      entityId: item._id,
      newValues: { name, category, condition, nextServiceDate }
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record maintenance service for an equipment item
// @route   POST /api/equipment/:id/service
const recordMaintenance = async (req, res) => {
  try {
    const { technician, serviceType, cost, notes, nextServiceIntervalDays = 90 } = req.body;
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    const serviceDate = new Date();
    const nextServiceDate = new Date();
    nextServiceDate.setDate(nextServiceDate.getDate() + Number(nextServiceIntervalDays));

    // 1. Create Maintenance log record
    const maintenanceRecord = await Maintenance.create({
      equipment: equipment._id,
      serviceDate,
      technician: technician || 'Internal Service Tech',
      serviceType: serviceType || 'Routine Inspection',
      cost: Number(cost) || 0,
      notes: notes || '',
      status: 'Completed'
    });

    // 2. Update equipment timestamps and condition
    equipment.lastServiceDate = serviceDate;
    equipment.nextServiceDate = nextServiceDate;
    equipment.condition = 'Good';
    if (notes) equipment.maintenanceNotes = notes;
    await equipment.save();

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'EQUIPMENT_MAINTAINED',
      entity: 'Equipment',
      entityId: equipment._id,
      details: `Serviced by ${technician}. Next service scheduled for ${nextServiceDate.toLocaleDateString()}`
    });

    res.status(201).json({
      success: true,
      message: 'Maintenance logged successfully! Next service date updated.',
      data: {
        equipment,
        maintenanceRecord
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get maintenance logs for an equipment item
// @route   GET /api/equipment/:id/logs
const getEquipmentLogs = async (req, res) => {
  try {
    const logs = await Maintenance.find({ equipment: req.params.id }).sort({ serviceDate: -1 });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEquipment,
  addEquipment,
  recordMaintenance,
  getEquipmentLogs
};
