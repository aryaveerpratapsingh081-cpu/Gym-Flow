const express = require('express');
const router = express.Router();
const {
  getLeads,
  createLead,
  addLeadFollowUp,
  convertLeadToMember
} = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', authorize('Admin', 'Trainer'), getLeads);
router.post('/', authorize('Admin', 'Trainer'), createLead);
router.post('/:id/follow-up', authorize('Admin', 'Trainer'), addLeadFollowUp);
router.post('/:id/convert', authorize('Admin'), convertLeadToMember);

module.exports = router;
