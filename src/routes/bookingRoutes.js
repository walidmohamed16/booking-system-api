const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBooking,
  getUpcomingBookings,
  confirmBooking,
  cancelBooking,
  completeBooking,
  rescheduleBooking
} = require('../controllers/bookingController');
const {
  createBookingValidation,
  cancelBookingValidation,
  rescheduleBookingValidation
} = require('../validations/bookingValidation');
const validate = require('../middlewares/validate');
const auth = require('../middlewares/auth');

// All routes need authentication
router.use(auth);

router.post('/', validate(createBookingValidation), createBooking);
router.get('/', getMyBookings);
router.get('/upcoming', getUpcomingBookings);
router.get('/:id', getBooking);
router.put('/:id/confirm', confirmBooking);
router.put('/:id/cancel', validate(cancelBookingValidation), cancelBooking);
router.put('/:id/complete', completeBooking);
router.put('/:id/reschedule', validate(rescheduleBookingValidation), rescheduleBooking);

module.exports = router;