const rateLimit = require('express-rate-limit');

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    status: 'fail',
    message: 'Too many requests, please try again after 15 minutes'
  }
});

// Auth limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: {
    status: 'fail',
    message: 'Too many login attempts, please try again after 15 minutes'
  }
});

module.exports = { apiLimiter, authLimiter };