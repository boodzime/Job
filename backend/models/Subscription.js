import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planName: {
    type: String,
    enum: ['free', 'starter', 'pro', 'enterprise'],
    required: true
  },
  planPrice: Number,
  currency: {
    type: String,
    default: 'PLN'
  },
  // Credits system
  cvAnalysisCredits: {
    type: Number,
    default: 0
  },
  mockInterviewCredits: {
    type: Number,
    default: 0
  },
  jobMatchingCredits: {
    type: Number,
    default: 0
  },
  // Payment Info
  stripeSubscriptionId: String,
  stripePaymentMethodId: String,
  
  // Billing Cycle
  billingCycle: {
    type: String,
    enum: ['monthly', 'annual'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  renewalDate: Date,
  cancelledAt: Date,
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'expired'],
    default: 'active'
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
