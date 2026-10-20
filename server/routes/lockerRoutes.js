const express = require('express');
const router = express.Router();
const {
  getLockers,
  allocateLocker,
  releaseLocker
} = require('../controllers/lockerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getLockers);
router.post('/:id/allocate', authorize('Admin', 'Trainer'), allocateLocker);
router.post('/:id/release', authorize('Admin', 'Trainer'), releaseLocker);

module.exports = router;
