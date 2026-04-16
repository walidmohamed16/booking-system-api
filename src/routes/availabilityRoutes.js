const express = require('express');
const router = express.Router();
const {
  setAvailability,
  getMyAvailability,
  getProviderAvailability,
  getAvailableSlots,
  updateAvailability,
  deleteAvailability
} = require('../controllers/availabilityController');
const { createAvailabilityValidation, updateAvailabilityValidation } = require('../validations/availabilityValidation');
const validate = require('../middlewares/validate');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');

// Public routes
router.get('/provider/:providerId', getProviderAvailability);
router.get('/provider/:providerId/slots', getAvailableSlots);

// Protected routes (Provider only)
router.use(auth, authorize('provider'));
router.get('/me', getMyAvailability);
router.post('/', validate(createAvailabilityValidation), setAvailability);
router.put('/:dayOfWeek', validate(updateAvailabilityValidation), updateAvailability);
router.delete('/:dayOfWeek', deleteAvailability);

module.exports = router;