const Joi = require('joi');

const createReviewValidation = Joi.object({
  bookingId: Joi.string()
    .required()
    .messages({
      'any.required': 'Booking ID is required'
    }),
  rating: Joi.number()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating cannot be more than 5',
      'any.required': 'Rating is required'
    }),
  comment: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Comment cannot be more than 500 characters'
    })
});

module.exports = {
  createReviewValidation
};