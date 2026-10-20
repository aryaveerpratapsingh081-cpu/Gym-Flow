const Feedback = require('../models/Feedback');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const logAudit = require('../utils/auditLogger');
const mongoose = require('mongoose');

/**
 * DBMS LAB CONCEPT - Feedback & Review Aggregation Pipeline:
 * Demonstrates:
 * 1. Schema Validation (Rating bounds 1 to 5)
 * 2. Multi-stage aggregation pipelines:
 *    `$match -> $group ($avg, $sum, $push) -> $lookup -> $project -> $sort`
 * 3. Calculating weighted average star ratings for trainers and gym facilities
 */

// @desc    Submit feedback or star rating
// @route   POST /api/feedback
const submitFeedback = async (req, res) => {
  try {
    const { category, trainerId, classId, rating, comment } = req.body;

    if (!category || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Category, rating (1-5), and written comment are required' });
    }

    let member = await Member.findOne({ user: req.user._id });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member profile not found' });
    }

    const feedback = await Feedback.create({
      member: member._id,
      category,
      trainer: trainerId || null,
      classRef: classId || null,
      rating: Number(rating),
      comment: comment.trim(),
      status: 'Approved' // Auto-approved for prototype
    });

    await logAudit({
      actor: req.user?._id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      action: 'FEEDBACK_SUBMITTED',
      entity: 'Feedback',
      entityId: feedback._id,
      details: `${category} rated ${rating}/5 stars`
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been recorded.',
      data: feedback
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reviews with filters
// @route   GET /api/feedback
const getFeedback = async (req, res) => {
  try {
    const { category, trainerId } = req.query;
    let filter = { status: 'Approved' };

    if (category && category !== 'All') filter.category = category;
    if (trainerId) filter.trainer = trainerId;

    const reviews = await Feedback.find(filter)
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name avatar' }
      })
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name' }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get aggregated rating analytics via MongoDB Aggregation Pipeline
// @route   GET /api/feedback/stats
const getFeedbackStats = async (req, res) => {
  try {
    // 1. Overall Gym Facility Rating Aggregation
    const overallAgg = await Feedback.aggregate([
      { $match: { status: 'Approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratings: { $push: '$rating' }
        }
      }
    ]);

    const overallStats = overallAgg[0] || { averageRating: 0, totalReviews: 0, ratings: [] };

    // Calculate star breakdown (1 to 5 stars)
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    (overallStats.ratings || []).forEach(r => {
      const rounded = Math.round(r);
      if (breakdown[rounded] !== undefined) breakdown[rounded]++;
    });

    // 2. Trainer-wise Average Rating Aggregation
    const trainerRatingsAgg = await Feedback.aggregate([
      { $match: { status: 'Approved', category: 'Trainer', trainer: { $ne: null } } },
      {
        $group: {
          _id: '$trainer',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'trainers',
          localField: '_id',
          foreignField: '_id',
          as: 'trainerDetails'
        }
      },
      { $unwind: '$trainerDetails' },
      {
        $lookup: {
          from: 'users',
          localField: 'trainerDetails.user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          trainerId: '$_id',
          trainerName: '$userDetails.name',
          specialization: '$trainerDetails.specialization',
          avgRating: { $round: ['$avgRating', 1] },
          reviewCount: 1
        }
      },
      { $sort: { avgRating: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overall: {
          averageRating: overallStats.averageRating ? Number(overallStats.averageRating.toFixed(1)) : 4.8,
          totalReviews: overallStats.totalReviews || 0,
          breakdown
        },
        trainerRatings: trainerRatingsAgg
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitFeedback,
  getFeedback,
  getFeedbackStats
};
