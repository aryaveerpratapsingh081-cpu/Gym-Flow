const express = require('express');
const router = express.Router();
const {
  addProgress,
  getMemberProgress,
  deleteProgress
} = require('../controllers/progressController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', authorize('Trainer', 'Admin'), addProgress);
router.get('/member/:memberId', getMemberProgress);
router.delete('/:id', authorize('Trainer', 'Admin'), deleteProgress);

module.exports = router;
