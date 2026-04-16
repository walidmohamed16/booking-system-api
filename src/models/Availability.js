const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  start: {
    type: String,
    required: [true, 'Start time is required']
  },
  end: {
    type: String,
    required: [true, 'End time is required']
  }
}, { _id: false });

const availabilitySchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dayOfWeek: {
    type: Number,
    required: [true, 'Day of week is required'],
    min: 0,
    max: 6
  },
  timeSlots: {
    type: [timeSlotSchema],
    required: [true, 'At least one time slot is required']
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Provider مينفعش يكون عنده نفس اليوم مرتين
availabilitySchema.index({ provider: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);