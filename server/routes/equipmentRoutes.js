const express = require('express');
const router = express.Router();
const {
  getEquipment,
  addEquipment,
  recordMaintenance,
  getEquipmentLogs
} = require('../controllers/equipmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getEquipment);
router.post('/', authorize('Admin'), addEquipment);
router.post('/:id/service', authorize('Admin'), recordMaintenance);
router.get('/:id/logs', getEquipmentLogs);

module.exports = router;
