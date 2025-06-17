const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  plan: {
    type: String,
    enum: ['novice', 'corporate', 'elite'],
    default: 'novice'
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  paymentId: {
    type: String,
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  autoRenew: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema); 