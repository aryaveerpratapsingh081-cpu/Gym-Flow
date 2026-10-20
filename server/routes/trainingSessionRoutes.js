const express = require('express');
const router = express.Router();
const {
  getTrainingSessions,
  bookTrainingSession,
  updateSessionStatus
} = require('../controllers/trainingSessionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getTrainingSessions);
router.post('/', bookTrainingSession);
router.put('/:id/status', updateSessionStatus);

module.exports = router;
