const Joi = require('joi');

const createBookingValidation = Joi.object({
  providerId: Joi.string()
    .required()
    .messages({
      'any.required': 'Provider ID is required'
    }),
  serviceId: Joi.string()
    .required()
    .messages({
      'any.required': 'Service ID is required'
    }),
  date: Joi.string()
    .required()
    .messages({
      'any.required': 'Date is required'
    }),
  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format',
      'any.required': 'Start time is required'
    }),
  notes: Joi.string()
    .max(500)
    .optional()
});

const cancelBookingValidation = Joi.object({
  cancellationReason: Joi.string()
    .required()
    .messages({
      'any.required': 'Cancellation reason is required'
    })
});

const rescheduleBookingValidation = Joi.object({
  date: Joi.string()
    .required()
    .messages({
      'any.required': 'New date is required'
    }),
  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format',
      'any.required': 'New start time is required'
    })
});

module.exports = {
  createBookingValidation,
  cancelBookingValidation,
  rescheduleBookingValidation
};