import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  stripePaymentIntentId: String,
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'PLN'
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'paypal'],
    default: 'card'
  },
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  receiptUrl: String,
  failureReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
