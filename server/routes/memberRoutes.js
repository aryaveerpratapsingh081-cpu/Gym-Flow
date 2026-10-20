const express = require('express');
const router = express.Router();
const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
} = require('../controllers/memberController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(authorize('Admin', 'Trainer'), getMembers)
  .post(authorize('Admin'), createMember);

router.route('/:id')
  .get(getMemberById)
  .put(authorize('Admin'), updateMember)
  .delete(authorize('Admin'), deleteMember);

module.exports = router;
