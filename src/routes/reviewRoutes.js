const express = require('express');
const router = express.Router();
const {
  createReview,
  getProviderReviews,
  getMyReviews,
  deleteReview
} = require('../controllers/reviewController');
const { createReviewValidation } = require('../validations/reviewValidation');
const validate = require('../middlewares/validate');
const auth = require('../middlewares/auth');

// Public routes
router.get('/provider/:providerId', getProviderReviews);

// Protected routes
router.use(auth);
router.post('/', validate(createReviewValidation), createReview);
router.get('/me', getMyReviews);
router.delete('/:id', deleteReview);

module.exports = router;