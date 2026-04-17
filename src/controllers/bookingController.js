const {
  sendNewBookingToProvider,
  sendNewBookingToClient,
  sendBookingConfirmed,
  sendBookingCancelled,
  sendBookingRescheduled,
  sendBookingCompleted
} = require('../utils/email');

const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Availability = require('../models/Availability');
const ApiError = require('../utils/apiError');

// Helper Functions
function addMinutes(time, minutes) {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

function isOverlapping(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}

// ⭐ Create Booking
exports.createBooking = async (req, res, next) => {
  try {
    const { providerId, serviceId, date, startTime, notes } = req.body;
    const clientId = req.user.id;

    // 1. Client can't book with himself
    if (clientId === providerId) {
      return next(new ApiError('You cannot book with yourself', 400));
    }

    // 2. Get service details
    const service = await Service.findById(serviceId);
    if (!service) {
      return next(new ApiError('Service not found', 404));
    }

    // 3. Check if service belongs to provider
    if (service.provider.toString() !== providerId) {
      return next(new ApiError('This service does not belong to this provider', 400));
    }

    // 4. Calculate end time
    const endTime = addMinutes(startTime, service.duration);

    // 5. Check if date is in the future
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      return next(new ApiError('Cannot book in the past', 400));
    }

    // 6. Check provider availability for that day
    const dayOfWeek = bookingDate.getDay();
    const availability = await Availability.findOne({
      provider: providerId,
      dayOfWeek,
      isAvailable: true
    });

    if (!availability) {
      return next(new ApiError('Provider is not available on this day', 400));
    }

    // 7. Check if time is within available slots
    const isWithinSlot = availability.timeSlots.some(slot => {
      return startTime >= slot.start && endTime <= slot.end;
    });

    if (!isWithinSlot) {
      return next(new ApiError('Selected time is outside provider available hours', 400));
    }

    // 8. ⭐ Check for conflicts (most important!)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const conflict = await Booking.findOne({
      provider: providerId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (conflict) {
      return next(new ApiError('This time slot is already booked', 409));
    }

    // 9. Create booking
    const booking = await Booking.create({
      client: clientId,
      provider: providerId,
      service: serviceId,
      date: bookingDate,
      startTime,
      endTime,
      notes,
      status: 'pending'
    });

    // 10. Populate and return
    const populatedBooking = await Booking.findById(booking._id)
      .populate('client', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'name duration price');
    // 11. Send emails ✉️
    await sendNewBookingToProvider(populatedBooking);
    await sendNewBookingToClient(populatedBooking);

    res.status(201).json({
      status: 'success',
      data: { booking: populatedBooking }
    });
  } catch (error) {
    next(error);
  }
};

// Get My Bookings (Client or Provider)
exports.getMyBookings = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    const queryObj = {};

    // Check if user is client or provider
    if (req.user.role === 'provider') {
      queryObj.provider = req.user.id;
    } else {
      queryObj.client = req.user.id;
    }

    // Filter by status
    if (status) queryObj.status = status;

    // Filter by date
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      queryObj.date = { $gte: startOfDay, $lte: endOfDay };
    }

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const bookings = await Booking.find(queryObj)
      .populate('client', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'name duration price')
      .sort('-date')
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments(queryObj);

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: { bookings }
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Booking
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('client', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'name duration price');

    if (!booking) {
      return next(new ApiError('Booking not found', 404));
    }

    // Check if user is owner
    if (
      booking.client._id.toString() !== req.user.id &&
      booking.provider._id.toString() !== req.user.id
    ) {
      return next(new ApiError('You are not authorized to view this booking', 403));
    }

    res.status(200).json({
      status: 'success',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

// Get Upcoming Bookings
exports.getUpcomingBookings = async (req, res, next) => {
  try {
    const queryObj = {
      date: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] }
    };

    if (req.user.role === 'provider') {
      queryObj.provider = req.user.id;
    } else {
      queryObj.client = req.user.id;
    }

    const bookings = await Booking.find(queryObj)
      .populate('client', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'name duration price')
      .sort('date startTime');

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: { bookings }
    });
  } catch (error) {
    next(error);
  }
};

// ⭐ Confirm Booking (Provider only)
exports.confirmBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new ApiError('Booking not found', 404));
    }

    // Only provider can confirm
    if (booking.provider.toString() !== req.user.id) {
      return next(new ApiError('Only the provider can confirm bookings', 403));
    }

    // Can only confirm pending bookings
    if (booking.status !== 'pending') {
      return next(new ApiError(`Cannot confirm a ${booking.status} booking`, 400));
    }

    booking.status = 'confirmed';
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('client', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'name duration price');
    // Send email ✉️
    await sendBookingConfirmed(populatedBooking);  

    res.status(200).json({
      status: 'success',
      message: 'Booking confirmed successfully',
      data: { booking: populatedBooking }
    });
  } catch (error) {
    next(error);
  }
};

// ⭐ Cancel Booking
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new ApiError('Booking not found', 404));
    }

    // Check if user is owner
    if (
      booking.client.toString() !== req.user.id &&
      booking.provider.toString() !== req.user.id
    ) {
      return next(new ApiError('You are not authorized to cancel this booking', 403));
    }

    // Can't cancel completed or already cancelled
    if (['cancelled', 'completed'].includes(booking.status)) {
      return next(new ApiError(`Cannot cancel a ${booking.status} booking`, 400));
    }

    booking.status = 'cancelled';
    booking.cancellationReason = req.body.cancellationReason;
    booking.cancelledBy = req.user.id;
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('client', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'name duration price')
      .populate('cancelledBy', 'name');

    // Send email ✉️
    await sendBookingCancelled(populatedBooking, req.user.name);
    res.status(200).json({
      status: 'success',
      message: 'Booking cancelled successfully',
      data: { booking: populatedBooking }
    });
  } catch (error) {
    next(error);
  }
};

// ⭐ Complete Booking (Provider only)
exports.completeBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new ApiError('Booking not found', 404));
    }

    if (booking.provider.toString() !== req.user.id) {
      return next(new ApiError('Only the provider can complete bookings', 403));
    }

    if (booking.status !== 'confirmed') {
      return next(new ApiError(`Cannot complete a ${booking.status} booking`, 400));
    }

    booking.status = 'completed';
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('client', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'name duration price');

    // Send email ✉️
    await sendBookingCompleted(populatedBooking);
      res.status(200).json({
      status: 'success',
      message: 'Booking completed successfully',
      data: { booking: populatedBooking }
    });
  } catch (error) {
    next(error);
  }
};

// ⭐ Reschedule Booking
exports.rescheduleBooking = async (req, res, next) => {
  try {
    const { date, startTime } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new ApiError('Booking not found', 404));
    }

    // Check if user is owner
    if (
      booking.client.toString() !== req.user.id &&
      booking.provider.toString() !== req.user.id
    ) {
      return next(new ApiError('You are not authorized to reschedule this booking', 403));
    }

    // Can only reschedule pending or confirmed
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return next(new ApiError(`Cannot reschedule a ${booking.status} booking`, 400));
    }

    // Get service for duration
    const service = await Service.findById(booking.service);
    const endTime = addMinutes(startTime, service.duration);

    // Check new date is in future
    const newDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate < today) {
      return next(new ApiError('Cannot reschedule to a past date', 400));
    }

    // Check provider availability
    const dayOfWeek = newDate.getDay();
    const availability = await Availability.findOne({
      provider: booking.provider,
      dayOfWeek,
      isAvailable: true
    });

    if (!availability) {
      return next(new ApiError('Provider is not available on this day', 400));
    }

    // Check time is within slots
    const isWithinSlot = availability.timeSlots.some(slot => {
      return startTime >= slot.start && endTime <= slot.end;
    });

    if (!isWithinSlot) {
      return next(new ApiError('Selected time is outside provider available hours', 400));
    }

    // Check for conflicts
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const conflict = await Booking.findOne({
      _id: { $ne: booking._id },
      provider: booking.provider,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (conflict) {
      return next(new ApiError('This time slot is already booked', 409));
    }

    // Update booking
    booking.date = newDate;
    booking.startTime = startTime;
    booking.endTime = endTime;
    booking.status = 'pending';
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('client', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'name duration price');
    // Send email ✉️
    await sendBookingRescheduled(populatedBooking, req.user.name);
    res.status(200).json({
      status: 'success',
      message: 'Booking rescheduled successfully',
      data: { booking: populatedBooking }
    });
  } catch (error) {
    next(error);
  }
};