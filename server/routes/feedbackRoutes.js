const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getFeedback,
  getFeedbackStats
} = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getFeedback);
router.get('/stats', getFeedbackStats);

router.use(protect);
router.post('/', submitFeedback);

module.exports = router;
