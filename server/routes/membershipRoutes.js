const express = require('express');
const router = express.Router();
const {
  assignMembership,
  getMemberships,
  getExpiringMemberships,
  freezeMembership,
  resumeMembership,
  renewMembership,
  updateMembershipStatus
} = require('../controllers/membershipController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', authorize('Admin'), assignMembership);
router.get('/', getMemberships);
router.get('/expiring', getExpiringMemberships);
router.put('/:id/freeze', freezeMembership);
router.put('/:id/resume', resumeMembership);
router.post('/:id/renew', renewMembership);
router.put('/:id/status', authorize('Admin'), updateMembershipStatus);

module.exports = router;
