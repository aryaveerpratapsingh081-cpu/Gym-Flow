const express = require('express');
const router = express.Router();
const {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} = require('../controllers/planController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route for landing page or protected
router.get('/', getPlans);
router.get('/:id', getPlanById);

router.post('/', protect, authorize('Admin'), createPlan);
router.put('/:id', protect, authorize('Admin'), updatePlan);
router.delete('/:id', protect, authorize('Admin'), deletePlan);

module.exports = router;
