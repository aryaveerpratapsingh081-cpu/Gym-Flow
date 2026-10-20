const express = require('express');
const router = express.Router();
const {
  getTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  deleteTrainer
} = require('../controllers/trainerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getTrainers)
  .post(authorize('Admin'), createTrainer);

router.route('/:id')
  .get(getTrainerById)
  .put(authorize('Admin'), updateTrainer)
  .delete(authorize('Admin'), deleteTrainer);

module.exports = router;
