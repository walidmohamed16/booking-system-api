const Joi = require('joi');

const createServiceValidation = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'any.required': 'Service name is required'
    }),
  description: Joi.string()
    .max(500)
    .optional(),
  duration: Joi.number()
    .valid(15, 30, 45, 60, 90, 120)
    .required()
    .messages({
      'any.only': 'Duration must be 15, 30, 45, 60, 90, or 120 minutes',
      'any.required': 'Duration is required'
    }),
  price: Joi.number()
    .min(0)
    .required()
    .messages({
      'any.required': 'Price is required'
    }),
  currency: Joi.string()
    .default('EGP'),
  category: Joi.string()
    .valid('medical', 'consulting', 'education', 'fitness', 'beauty', 'legal', 'other')
    .required()
    .messages({
      'any.required': 'Category is required'
    }),
  location: Joi.string()
    .valid('online', 'onsite', 'both')
    .default('online')
});

const updateServiceValidation = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional(),
  description: Joi.string()
    .max(500)
    .optional(),
  duration: Joi.number()
    .valid(15, 30, 45, 60, 90, 120)
    .optional(),
  price: Joi.number()
    .min(0)
    .optional(),
  currency: Joi.string()
    .optional(),
  category: Joi.string()
    .valid('medical', 'consulting', 'education', 'fitness', 'beauty', 'legal', 'other')
    .optional(),
  location: Joi.string()
    .valid('online', 'onsite', 'both')
    .optional(),
  isActive: Joi.boolean()
    .optional()
});

module.exports = {
  createServiceValidation,
  updateServiceValidation
};