
const Joi = require('joi');

const timeSlotSchema = Joi.object({
  start: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format (e.g., 09:00)',
      'any.required': 'Start time is required'
    }),
  end: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      'string.pattern.base': 'End time must be in HH:MM format (e.g., 17:00)',
      'any.required': 'End time is required'
    })
});

const createAvailabilityValidation = Joi.object({
  dayOfWeek: Joi.number()
    .min(0)
    .max(6)
    .required()
    .messages({
      'number.min': 'Day of week must be between 0 (Sunday) and 6 (Saturday)',
      'number.max': 'Day of week must be between 0 (Sunday) and 6 (Saturday)',
      'any.required': 'Day of week is required'
    }),
  timeSlots: Joi.array()
    .items(timeSlotSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one time slot is required',
      'any.required': 'Time slots are required'
    }),
  isAvailable: Joi.boolean()
    .default(true)
});

const updateAvailabilityValidation = Joi.object({
  timeSlots: Joi.array()
    .items(timeSlotSchema)
    .min(1)
    .optional(),
  isAvailable: Joi.boolean()
    .optional()
});

module.exports = {
  createAvailabilityValidation,
  updateAvailabilityValidation
};