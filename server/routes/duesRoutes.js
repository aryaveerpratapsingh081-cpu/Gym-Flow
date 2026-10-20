const express = require('express');
const router = express.Router();
const {
  getDuesAndDefaulters,
  settleDuesPayment
} = require('../controllers/duesController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', authorize('Admin'), getDuesAndDefaulters);
router.post('/:id/pay', authorize('Admin'), settleDuesPayment);

module.exports = router;
