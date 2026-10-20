const express = require('express');
const router = express.Router();
const { getUserNotifications, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getUserNotifications);
router.put('/read', markAsRead);

module.exports = router;
