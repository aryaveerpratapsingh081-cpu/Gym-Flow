const express = require('express');
const router = express.Router();
const {
  getDietPlans,
  createDietPlan,
  updateDietPlan
} = require('../controllers/dietPlanController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getDietPlans);
router.post('/', authorize('Admin', 'Trainer'), createDietPlan);
router.put('/:id', authorize('Admin', 'Trainer'), updateDietPlan);

module.exports = router;
