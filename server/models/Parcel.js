const mongoose = require('mongoose');

const parcelSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  parcelName: {
    type: String,
    required: true,
    trim: true,
  },
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  expectedArrivalDate: {
    type: Date,
    required: true,
  },
  arrivalDate: {
    type: Date,
  },
  pickupDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Expected', 'Arrived', 'Ready for Pickup', 'Delivered'],
    default: 'Expected',
  },
  otp: {
    type: String,
  },
  fee: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Parcel', parcelSchema);
