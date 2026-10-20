const express = require('express');
const router = express.Router();
const {
  createOrUpdateWorkout,
  getMemberWorkout,
  getAllWorkouts,
  deleteWorkout
} = require('../controllers/workoutController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', authorize('Trainer', 'Admin'), createOrUpdateWorkout);
router.get('/', authorize('Trainer', 'Admin'), getAllWorkouts);
router.get('/member/:memberId', getMemberWorkout);
router.delete('/:id', authorize('Trainer', 'Admin'), deleteWorkout);

module.exports = router;
