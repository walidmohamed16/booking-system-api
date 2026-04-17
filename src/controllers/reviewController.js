const Review = require('../models/Review');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');

// Create Review (Client only)
exports.createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const clientId = req.user.id;

    // 1. Check if booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(new ApiError('Booking not found', 404));
    }

    // 2. Check if user is the client of this booking
    if (booking.client.toString() !== clientId) {
      return next(new ApiError('You can only review your own bookings', 403));
    }

    // 3. Check if booking is completed
    if (booking.status !== 'completed') {
      return next(new ApiError('You can only review completed bookings', 400));
    }

    // 4. Check if already reviewed
    const existingReview = await Review.findOne({
      client: clientId,
      booking: bookingId
    });

    if (existingReview) {
      return next(new ApiError('You have already reviewed this booking', 400));
    }

    // 5. Create review
    const review = await Review.create({
      client: clientId,
      provider: booking.provider,
      booking: bookingId,
      rating,
      comment
    });

    const populatedReview = await Review.findById(review._id)
      .populate('client', 'name')
      .populate('provider', 'name')
      .populate('booking', 'date startTime endTime');

    res.status(201).json({
      status: 'success',
      data: { review: populatedReview }
    });
  } catch (error) {
    next(error);
  }
};

// Get Provider Reviews (Public)
exports.getProviderReviews = async (req, res, next) => {
  try {
    const { providerId } = req.params;

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ provider: providerId })
      .populate('client', 'name avatar')
      .populate('booking', 'date startTime endTime')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ provider: providerId });

    // Calculate average rating and stats
    const stats = await Review.aggregate([
      {
        $match: {
          provider: new mongoose.Types.ObjectId(providerId)
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          rating5: {
            $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] }
          },
          rating4: {
            $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] }
          },
          rating3: {
            $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] }
          },
          rating2: {
            $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] }
          },
          rating1: {
            $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      stats: stats[0] || {
        averageRating: 0,
        totalReviews: 0,
        rating5: 0,
        rating4: 0,
        rating3: 0,
        rating2: 0,
        rating1: 0
      },
      data: { reviews }
    });
  } catch (error) {
    next(error);
  }
};

// Get My Reviews (Client)
exports.getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ client: req.user.id })
      .populate('provider', 'name')
      .populate('booking', 'date startTime endTime')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: { reviews }
    });
  } catch (error) {
    next(error);
  }
};

// Delete Review (Client only - owner)
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ApiError('Review not found', 404));
    }

    // Check ownership
    if (review.client.toString() !== req.user.id) {
      return next(new ApiError('You can only delete your own reviews', 403));
    }

    await Review.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};