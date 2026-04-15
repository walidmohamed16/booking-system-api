const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Service must belong to a provider']
  },
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    enum: [15, 30, 45, 60, 90, 120]
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  currency: {
    type: String,
    default: 'EGP'
  },
  category: {
    type: String,
    enum: ['medical', 'consulting', 'education', 'fitness', 'beauty', 'legal', 'other'],
    required: [true, 'Category is required']
  },
  location: {
    type: String,
    enum: ['online', 'onsite', 'both'],
    default: 'online'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);