const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const ApiError = require('../utils/apiError');

// Set Availability (Provider)
exports.setAvailability = async (req, res, next) => {
  try {
    const { dayOfWeek, timeSlots, isAvailable } = req.body;

    // Validate time slots (start must be before end)
    for (const slot of timeSlots) {
      if (slot.start >= slot.end) {
        return next(new ApiError('Start time must be before end time', 400));
      }
    }

    // Check if availability already exists for this day
    const existing = await Availability.findOne({
      provider: req.user.id,
      dayOfWeek
    });

    let availability;

    if (existing) {
      // Update existing
      existing.timeSlots = timeSlots;
      existing.isAvailable = isAvailable;
      availability = await existing.save();
    } else {
      // Create new
      availability = await Availability.create({
        provider: req.user.id,
        dayOfWeek,
        timeSlots,
        isAvailable
      });
    }

    res.status(200).json({
      status: 'success',
      data: { availability }
    });
  } catch (error) {
    next(error);
  }
};

// Get My Availability (Provider)
exports.getMyAvailability = async (req, res, next) => {
  try {
    const availability = await Availability.find({
      provider: req.user.id
    }).sort('dayOfWeek');

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const formatted = availability.map(item => ({
      ...item.toObject(),
      dayName: days[item.dayOfWeek]
    }));

    res.status(200).json({
      status: 'success',
      data: { availability: formatted }
    });
  } catch (error) {
    next(error);
  }
};

// Get Provider Availability (Public)
exports.getProviderAvailability = async (req, res, next) => {
  try {
    const availability = await Availability.find({
      provider: req.params.providerId,
      isAvailable: true
    }).sort('dayOfWeek');

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const formatted = availability.map(item => ({
      ...item.toObject(),
      dayName: days[item.dayOfWeek]
    }));

    res.status(200).json({
      status: 'success',
      data: { availability: formatted }
    });
  } catch (error) {
    next(error);
  }
};

// Get Available Slots for a specific date ⭐⭐⭐
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { providerId } = req.params;
    const { date, serviceId } = req.query;

    if (!date || !serviceId) {
      return next(new ApiError('Date and serviceId are required', 400));
    }

    // 1. Get service duration
    const service = await Service.findById(serviceId);
    if (!service) {
      return next(new ApiError('Service not found', 404));
    }
    const duration = service.duration;

    // 2. Get day of week from date
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();

    // 3. Get provider availability for that day
    const availability = await Availability.findOne({
      provider: providerId,
      dayOfWeek,
      isAvailable: true
    });

    if (!availability) {
      return res.status(200).json({
        status: 'success',
        message: 'Provider is not available on this day',
        data: { slots: [] }
      });
    }

    // 4. Get existing bookings for that date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await Booking.find({
      provider: providerId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    });

    // 5. Generate all possible slots
    const allSlots = [];
    for (const timeSlot of availability.timeSlots) {
      let currentTime = timeSlot.start;
      while (addMinutes(currentTime, duration) <= timeSlot.end) {
        const endTime = addMinutes(currentTime, duration);
        allSlots.push({
          start: currentTime,
          end: endTime
        });
        currentTime = endTime;
      }
    }

    // 6. Filter out booked slots
    const availableSlots = allSlots.filter(slot => {
      return !existingBookings.some(booking => {
        return isOverlapping(
          slot.start, slot.end,
          booking.startTime, booking.endTime
        );
      });
    });

    res.status(200).json({
      status: 'success',
      date,
      duration: `${duration} minutes`,
      totalSlots: allSlots.length,
      availableSlots: availableSlots.length,
      data: { slots: availableSlots }
    });
  } catch (error) {
    next(error);
  }
};

// Update Availability for a specific day
exports.updateAvailability = async (req, res, next) => {
  try {
    const { dayOfWeek } = req.params;

    const availability = await Availability.findOne({
      provider: req.user.id,
      dayOfWeek: Number(dayOfWeek)
    });

    if (!availability) {
      return next(new ApiError('Availability not found for this day', 404));
    }

    if (req.body.timeSlots) {
      for (const slot of req.body.timeSlots) {
        if (slot.start >= slot.end) {
          return next(new ApiError('Start time must be before end time', 400));
        }
      }
      availability.timeSlots = req.body.timeSlots;
    }

    if (req.body.isAvailable !== undefined) {
      availability.isAvailable = req.body.isAvailable;
    }

    await availability.save();

    res.status(200).json({
      status: 'success',
      data: { availability }
    });
  } catch (error) {
    next(error);
  }
};

// Delete Availability for a specific day
exports.deleteAvailability = async (req, res, next) => {
  try {
    const { dayOfWeek } = req.params;

    const availability = await Availability.findOneAndDelete({
      provider: req.user.id,
      dayOfWeek: Number(dayOfWeek)
    });

    if (!availability) {
      return next(new ApiError('Availability not found for this day', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Availability deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ===== Helper Functions =====

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